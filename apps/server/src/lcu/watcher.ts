import type {
  BanSlot,
  ChampSelectState,
  GamePhase,
  PlayerSlot,
  RankInfo,
  RecentForm,
  TeamSide,
} from '@krabi/shared';
import type { Store } from '../store.js';
import { LcuClient } from './client.js';
import { readLockfile } from './lockfile.js';

/* ---- formes (partielles) des réponses LCU utilisées ---- */

interface LcuCell {
  cellId: number;
  championId: number;
  championPickIntent: number;
  puuid?: string;
  assignedPosition?: string;
}

interface LcuAction {
  actorCellId: number;
  championId: number;
  type: string; // 'ban' | 'pick' | ...
  completed: boolean;
  isInProgress: boolean;
}

interface LcuSession {
  localPlayerCellId: number;
  myTeam: LcuCell[];
  theirTeam: LcuCell[];
  actions: LcuAction[][];
  timer: { adjustedTimeLeftInPhase: number; phase: string };
}

interface EnrichedPlayer {
  gameName?: string;
  tagLine?: string;
  rank?: RankInfo;
  form?: RecentForm;
}

const OPGG_REGIONS: Record<string, string> = {
  EUW: 'euw', EUW1: 'euw', NA: 'na', NA1: 'na', EUNE: 'eune', EUN1: 'eune',
  KR: 'kr', BR: 'br', BR1: 'br', JP: 'jp', JP1: 'jp', LA1: 'lan', LA2: 'las',
  OC1: 'oce', OCE: 'oce', TR: 'tr', TR1: 'tr', RU: 'ru', ME1: 'me',
  TW2: 'tw', VN2: 'vn', SG2: 'sg', PH2: 'ph', TH2: 'th',
};

/**
 * Boucle de veille LCU : détecte le client, suit le gameflow et clone la
 * champ select en temps réel. L'enrichissement (elo, forme, Riot ID) passe
 * aussi par le LCU — aucune clé API Riot nécessaire.
 */
export class LcuWatcher {
  private client: LcuClient | null = null;
  private cache = new Map<string, EnrichedPlayer>();
  private inflight = new Set<string>();
  private region = 'euw';
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private store: Store) {}

  start(): void {
    this.timer = setInterval(() => void this.tick(), 2000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.store.getSettings().demoMode) return; // le simulateur pilote l'état

    if (!this.client) {
      const creds = readLockfile();
      if (!creds) {
        this.store.setStatus({ lcu: false, gameflow: 'IDLE' });
        return;
      }
      this.client = new LcuClient(creds);
      void this.detectRegion();
    }

    try {
      const phase = await this.client.get<string>('/lol-gameflow/v1/gameflow-phase');
      const gameflow = mapPhase(phase);
      this.store.setStatus({ lcu: true, gameflow, region: this.region });

      if (gameflow === 'CHAMPSELECT') {
        const session = await this.client.get<LcuSession>('/lol-champ-select/v1/session');
        this.store.setChampSelect(this.mapSession(session));
        this.enrichTeam(session.myTeam);
      } else {
        this.store.setChampSelect(null);
        if (gameflow !== 'INGAME') this.cache.clear();
      }
    } catch {
      // client fermé ou endpoint indisponible : on retentera au prochain tick
      this.client = null;
      this.store.setStatus({ lcu: false, gameflow: 'IDLE' });
      this.store.setChampSelect(null);
    }
  }

  private async detectRegion(): Promise<void> {
    try {
      const info = await this.client!.get<{ region: string }>('/riotclient/region-locale');
      this.region = OPGG_REGIONS[info.region?.toUpperCase()] ?? 'euw';
    } catch {
      this.region = 'euw';
    }
  }

  private mapSession(session: LcuSession): ChampSelectState {
    const actions = session.actions.flat();
    const allyCellIds = new Set(session.myTeam.map((c) => c.cellId));

    const bans: BanSlot[] = actions
      .filter((a) => a.type === 'ban')
      .map((a) => ({
        side: (allyCellIds.has(a.actorCellId) ? 'ALLY' : 'ENEMY') as TeamSide,
        championId: a.completed ? a.championId : 0,
      }));

    const active = actions.filter((a) => a.isInProgress && !a.completed);
    const phaseLabel =
      session.timer.phase === 'PLANNING'
        ? 'DÉCLARATION'
        : session.timer.phase === 'FINALIZATION'
          ? 'FINALISATION'
          : active.some((a) => a.type === 'ban')
            ? 'PHASE DE BAN'
            : 'PHASE DE PICK';

    const mapCell = (cell: LcuCell, side: TeamSide): PlayerSlot => {
      const cellActions = actions.filter((a) => a.actorCellId === cell.cellId);
      const inProgress = cellActions.find((a) => a.isInProgress && !a.completed);
      const pickDone = cellActions.some((a) => a.type === 'pick' && a.completed);
      const enriched = (cell.puuid && this.cache.get(cell.puuid)) || {};

      const state = pickDone
        ? 'LOCKED'
        : inProgress
          ? inProgress.type === 'ban'
            ? 'BANNING'
            : 'PICKING'
          : 'WAITING';

      const opggUrl =
        enriched.gameName && enriched.tagLine
          ? `https://op.gg/summoners/${this.region}/${encodeURIComponent(enriched.gameName)}-${encodeURIComponent(enriched.tagLine)}`
          : undefined;

      return {
        cellId: cell.cellId,
        side,
        position: (cell.assignedPosition || '').toUpperCase(),
        championId: cell.championId || cell.championPickIntent || 0,
        isSelf: cell.cellId === session.localPlayerCellId,
        state,
        gameName: enriched.gameName,
        tagLine: enriched.tagLine,
        rank: enriched.rank,
        form: enriched.form,
        opggUrl,
      };
    };

    return {
      phaseLabel,
      timerMs: session.timer.adjustedTimeLeftInPhase,
      allies: session.myTeam.map((c) => mapCell(c, 'ALLY')),
      enemies: session.theirTeam.map((c) => mapCell(c, 'ENEMY')),
      bans,
    };
  }

  /** Enrichit chaque allié (Riot ID, rang solo, 5 dernières games) — 1 fois par puuid. */
  private enrichTeam(cells: LcuCell[]): void {
    for (const cell of cells) {
      const puuid = cell.puuid;
      if (!puuid || this.cache.has(puuid) || this.inflight.has(puuid)) continue;
      this.inflight.add(puuid);
      void this.enrichPlayer(puuid).finally(() => this.inflight.delete(puuid));
    }
  }

  private async enrichPlayer(puuid: string): Promise<void> {
    if (!this.client) return;
    const entry: EnrichedPlayer = {};

    try {
      const summoner = await this.client.get<{ gameName?: string; tagLine?: string }>(
        `/lol-summoner/v2/summoners/puuid/${puuid}`,
      );
      entry.gameName = summoner.gameName;
      entry.tagLine = summoner.tagLine;
    } catch { /* profil privé ou endpoint indisponible */ }

    try {
      const stats = await this.client.get<{
        queues?: Array<{ queueType: string; tier?: string; division?: string; leaguePoints?: number; wins?: number; losses?: number }>;
      }>(`/lol-ranked/v1/ranked-stats/${puuid}`);
      const solo = stats.queues?.find((q) => q.queueType === 'RANKED_SOLO_5x5');
      if (solo?.tier && solo.tier !== 'NONE') {
        const wins = solo.wins ?? 0;
        const losses = solo.losses ?? 0;
        entry.rank = {
          tier: solo.tier,
          division: solo.division && solo.division !== 'NA' ? solo.division : '',
          lp: solo.leaguePoints ?? 0,
          winrate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : undefined,
        };
      } else {
        entry.rank = { tier: 'UNRANKED', division: '', lp: 0 };
      }
    } catch { /* pas de stats classées */ }

    try {
      const history = await this.client.get<{
        games?: { games?: Array<{ participants?: Array<{ stats?: { win?: boolean } }> }> };
      }>(`/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=0&endIndex=5`);
      const games = history.games?.games ?? [];
      const results = games
        .map((g) => g.participants?.[0]?.stats?.win)
        .filter((w): w is boolean => typeof w === 'boolean');
      if (results.length > 0) {
        entry.form = {
          results,
          wins: results.filter(Boolean).length,
          losses: results.filter((w) => !w).length,
        };
      }
    } catch { /* historique indisponible */ }

    this.cache.set(puuid, entry);
    // force un re-map de la session au prochain tick (2s max)
  }
}

function mapPhase(phase: string): GamePhase {
  switch (phase) {
    case 'ChampSelect':
      return 'CHAMPSELECT';
    case 'InProgress':
    case 'GameStart':
      return 'INGAME';
    case 'WaitingForStats':
    case 'PreEndOfGame':
    case 'EndOfGame':
      return 'POSTGAME';
    case 'Lobby':
    case 'Matchmaking':
    case 'ReadyCheck':
      return 'LOBBY';
    default:
      return 'IDLE';
  }
}
