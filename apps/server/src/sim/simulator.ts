import {
  championById,
  FLASH_CD_SEC,
  OBJECTIVE_BY_ID,
  CAMP_BY_ID,
  ultCooldownSeconds,
  type BanSlot,
  type ChampSelectState,
  type LiveEvent,
  type LivePlayer,
  type PlayerSlot,
  type RankInfo,
  type RecentForm,
  type TeamSide,
} from '@krabi/shared';
import type { Store } from '../store.js';

const key = (id: string): number => championById(id)?.key ?? 0;

/* ---- scénario : compos et joueurs fictifs ---- */

const ALLY_COMP = ['Aatrox', 'LeeSin', 'Yasuo', 'Jinx', 'Pyke'].map(key);
const ENEMY_COMP = ['Malphite', 'Sejuani', 'Ahri', 'Ezreal', 'Leona'].map(key);
const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];

const ALLY_BANS = ['Hwei', 'Briar', 'Smolder', 'Vex', 'Kayn'].map(key);
const ENEMY_BANS = ['KSante', 'Gwen', 'Viego', 'Naafiri', 'Ambessa'].map(key);

interface MockAlly {
  gameName: string;
  tagLine: string;
  rank: RankInfo;
  form: RecentForm;
  isSelf?: boolean;
}

const MOCK_ALLIES: MockAlly[] = [
  { gameName: 'KRB Yann', tagLine: 'COACH', rank: { tier: 'EMERALD', division: 'II', lp: 43, winrate: 52 }, form: mkForm([1, 0, 1, 1, 0]) },
  { gameName: 'Adam', tagLine: 'KRABI', rank: { tier: 'DIAMOND', division: 'IV', lp: 12, winrate: 55 }, form: mkForm([1, 1, 1, 0, 1]), isSelf: true },
  { gameName: 'MidGapEnjoyer', tagLine: 'EUW', rank: { tier: 'PLATINUM', division: 'I', lp: 78, winrate: 49 }, form: mkForm([0, 0, 1, 0, 1]) },
  { gameName: 'DravenMain2007', tagLine: '123', rank: { tier: 'DIAMOND', division: 'II', lp: 56, winrate: 58 }, form: mkForm([1, 1, 1, 1, 0]) },
  { gameName: 'HookCity', tagLine: 'SUP', rank: { tier: 'EMERALD', division: 'IV', lp: 21, winrate: 51 }, form: mkForm([0, 1, 0, 1, 1]) },
];

function mkForm(results: number[]): RecentForm {
  const bools = results.map(Boolean);
  return { results: bools, wins: bools.filter(Boolean).length, losses: bools.filter((w) => !w).length };
}

/* ---- déroulé de la draft : bans/picks dans l'ordre compétitif ---- */

type DraftAction =
  | { kind: 'ban'; side: TeamSide; banIdx: number; sec: number }
  | { kind: 'pick'; side: TeamSide; slot: number; sec: number };

const ALLY_PICK_SEQ = [3, 1, 0, 2, 4]; // Jinx → Lee Sin → Aatrox → Yasuo → Pyke
const ENEMY_PICK_SEQ = [2, 4, 0, 3, 1]; // Ahri → Leona → Malphite → Ezreal → Sejuani

const BAN_SEC = 3;
const PICK_SEC = 5;
const FINALIZE_SEC = 8;

function buildDraftScript(): DraftAction[] {
  const script: DraftAction[] = [];
  let a = 0; // curseur ban ALLY
  let e = 0; // curseur ban ENEMY
  let ap = 0; // curseur pick ALLY
  let ep = 0; // curseur pick ENEMY
  const ban = (side: TeamSide) =>
    script.push({ kind: 'ban', side, banIdx: side === 'ALLY' ? a++ : e++, sec: BAN_SEC });
  const pick = (side: TeamSide) =>
    script.push({
      kind: 'pick',
      side,
      slot: side === 'ALLY' ? ALLY_PICK_SEQ[ap++] : ENEMY_PICK_SEQ[ep++],
      sec: PICK_SEC,
    });

  ban('ALLY'); ban('ENEMY'); ban('ALLY'); ban('ENEMY'); ban('ALLY'); ban('ENEMY');
  pick('ALLY'); pick('ENEMY'); pick('ENEMY'); pick('ALLY'); pick('ALLY'); pick('ENEMY');
  ban('ENEMY'); ban('ALLY'); ban('ENEMY'); ban('ALLY');
  pick('ENEMY'); pick('ALLY'); pick('ALLY'); pick('ENEMY');
  return script;
}

const DRAFT_SCRIPT = buildDraftScript();
const DRAFT_TOTAL_SEC = DRAFT_SCRIPT.reduce((s, act) => s + act.sec, 0);

/* ---- événements de la partie simulée (temps de jeu, x3 temps réel) ---- */

interface SimEvent {
  at: number; // secondes de jeu
  tag: string;
  detail: string;
  run?: (sim: Simulator) => void;
}

const GAME_SPEED = 3;
const GAME_END_SEC = 1560; // ~26 min de jeu

const SIM_EVENTS: SimEvent[] = [
  { at: 15, tag: 'START', detail: 'partie lancée · minions à 1:05' },
  { at: 35, tag: 'WARD', detail: 'ward posé ▸ pixel brush (bot river)' },
  { at: 65, tag: 'FLASH', detail: 'Leona (ennemi) ▸ FLASH grillé bot', run: (s) => s.autoFlash(9) },
  { at: 100, tag: 'KILL', detail: 'toi ▸ Ahri · solo kill mid lane', run: (s) => s.score(1, 'kills', 7, 'deaths') },
  { at: 200, tag: 'CAMP', detail: 'raptors bleus volés ▸ timer posé', run: (s) => s.autoCamp('blue_raptors') },
  { at: 215, tag: 'CAMP', detail: 'sentinelle bot prise', run: (s) => s.autoCamp('scuttle_bot') },
  { at: 300, tag: 'OBJ', detail: 'DRAGON infernal sécurisé', run: (s) => s.autoObjective('dragon') },
  { at: 380, tag: 'FLASH', detail: 'Malphite (ennemi) ▸ FLASH sur gank raté', run: (s) => s.autoFlash(5) },
  { at: 430, tag: 'DEATH', detail: 'toi ✕ Sejuani · gank rivière', run: (s) => s.score(6, 'kills', 1, 'deaths') },
  { at: 520, tag: 'ULT', detail: 'Malphite (ennemi) ▸ R utilisé mid', run: (s) => s.autoUlt(5) },
  { at: 620, tag: 'OBJ', detail: 'HÉRAUT ▸ posé top · plates x2', run: (s) => s.autoObjective('herald') },
  { at: 700, tag: 'KILL', detail: 'toi ▸ Ezreal · pick bot side', run: (s) => s.score(1, 'kills', 8, 'deaths') },
  { at: 800, tag: 'ULT', detail: 'Leona (ennemi) ▸ R engage raté', run: (s) => s.autoUlt(9) },
  { at: 900, tag: 'OBJ', detail: 'DRAGON océan sécurisé', run: (s) => s.autoObjective('dragon') },
  { at: 1050, tag: 'KILL', detail: 'toi ▸ double kill · teamfight mid', run: (s) => s.score(1, 'kills', 7, 'deaths') },
  { at: 1200, tag: 'OBJ', detail: 'BARON ▸ sécurisé après pick', run: (s) => s.autoObjective('baron') },
  { at: 1380, tag: 'INHIB', detail: 'inhibiteur mid détruit' },
];

/**
 * Mode démo : rejoue en boucle une champ select complète puis une partie,
 * en produisant exactement le même AppState que les connecteurs réels.
 * Permet de valider l'app de bout en bout sans client League.
 */
export class Simulator {
  private enabled = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private mode: 'draft' | 'game' = 'draft';
  private t = 0; // secondes écoulées dans le mode courant
  private eventSeq = 0;
  private feed: LiveEvent[] = [];
  private scores = new Map<number, { kills: number; deaths: number; assists: number }>();
  private firedEvents = new Set<number>();

  constructor(private store: Store) {}

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    if (enabled) {
      this.reset('draft');
      this.timer = setInterval(() => this.tick(), 1000);
      this.tick();
    } else {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.store.setChampSelect(null);
      this.store.setLive(null);
      this.store.clearTimers();
      this.store.setStatus({ demo: false, liveData: false, gameflow: 'IDLE' });
    }
  }

  private reset(mode: 'draft' | 'game'): void {
    this.mode = mode;
    this.t = 0;
    this.feed = [];
    this.firedEvents.clear();
    this.scores.clear();
    this.store.clearTimers();
  }

  private tick(): void {
    if (this.mode === 'draft') this.tickDraft();
    else this.tickGame();
  }

  /* ---- champ select ---- */

  private tickDraft(): void {
    if (this.t > DRAFT_TOTAL_SEC + FINALIZE_SEC) {
      this.reset('game');
      this.tickGame();
      return;
    }

    this.store.setStatus({ demo: true, lcu: false, liveData: false, gameflow: 'CHAMPSELECT', region: 'euw' });
    this.store.setChampSelect(this.buildChampSelect(this.t));
    this.store.setLive(null);
    this.t += 1;
  }

  private buildChampSelect(elapsed: number): ChampSelectState {
    // avance dans le script : quelles actions sont terminées, laquelle est active
    let cursor = 0;
    let active: DraftAction | null = null;
    let remainingSec = 0;
    const done: DraftAction[] = [];
    for (const action of DRAFT_SCRIPT) {
      if (elapsed >= cursor + action.sec) {
        done.push(action);
        cursor += action.sec;
      } else if (elapsed >= cursor) {
        active = action;
        remainingSec = cursor + action.sec - elapsed;
        break;
      }
    }
    const finalization = !active && done.length === DRAFT_SCRIPT.length;

    const bans: BanSlot[] = [];
    for (const side of ['ALLY', 'ENEMY'] as const) {
      const pool = side === 'ALLY' ? ALLY_BANS : ENEMY_BANS;
      const completed = done.filter((a) => a.kind === 'ban' && a.side === side).length;
      for (let i = 0; i < 5; i++) bans.push({ side, championId: i < completed ? pool[i] : 0 });
    }

    const pickedSlots = new Map<string, number>(); // `${side}:${slot}` -> championId
    for (const action of done) {
      if (action.kind === 'pick') {
        const pool = action.side === 'ALLY' ? ALLY_COMP : ENEMY_COMP;
        pickedSlots.set(`${action.side}:${action.slot}`, pool[action.slot]);
      }
    }

    const mkSlot = (side: TeamSide, slot: number): PlayerSlot => {
      const championId = pickedSlots.get(`${side}:${slot}`) ?? 0;
      const isActive = !!active && active.kind === 'pick' && active.side === side && active.slot === slot;
      const isBanTurn = !!active && active.kind === 'ban' && active.side === side && slot === 0;
      const ally = side === 'ALLY';
      const mock = ally ? MOCK_ALLIES[slot] : null;
      return {
        cellId: ally ? slot : slot + 5,
        side,
        position: POSITIONS[slot],
        championId,
        isSelf: Boolean(mock?.isSelf),
        state: championId ? 'LOCKED' : isActive ? 'PICKING' : isBanTurn ? 'BANNING' : 'WAITING',
        gameName: mock?.gameName,
        tagLine: mock?.tagLine,
        rank: mock?.rank,
        form: mock?.form,
        opggUrl: mock
          ? `https://op.gg/summoners/euw/${encodeURIComponent(mock.gameName)}-${encodeURIComponent(mock.tagLine)}`
          : undefined,
      };
    };

    return {
      phaseLabel: finalization ? 'FINALISATION' : active?.kind === 'ban' ? 'PHASE DE BAN' : 'PHASE DE PICK',
      timerMs: (finalization ? FINALIZE_SEC - (elapsed - DRAFT_TOTAL_SEC) : remainingSec) * 1000,
      allies: [0, 1, 2, 3, 4].map((i) => mkSlot('ALLY', i)),
      enemies: [0, 1, 2, 3, 4].map((i) => mkSlot('ENEMY', i)),
      bans,
    };
  }

  /* ---- partie en direct ---- */

  private tickGame(): void {
    const gameTime = this.t * GAME_SPEED;
    if (gameTime > GAME_END_SEC) {
      this.reset('draft');
      this.tickDraft();
      return;
    }

    for (const [idx, ev] of SIM_EVENTS.entries()) {
      if (gameTime >= ev.at && !this.firedEvents.has(idx)) {
        this.firedEvents.add(idx);
        this.feed.push({ id: ++this.eventSeq, timeSec: ev.at, tag: ev.tag, detail: ev.detail });
        ev.run?.(this);
      }
    }

    this.store.setStatus({ demo: true, lcu: false, liveData: true, gameflow: 'INGAME', region: 'euw' });
    this.store.setChampSelect(null);
    this.store.setLive({
      gameTimeSec: gameTime,
      players: this.buildPlayers(gameTime),
      events: this.feed.slice(-60),
    });
    this.t += 1;
  }

  private buildPlayers(gameTime: number): LivePlayer[] {
    const SPELLS: Record<number, [string, string]> = {
      0: ['SummonerFlash', 'SummonerTeleport'],
      1: ['SummonerFlash', 'SummonerSmite'],
      2: ['SummonerFlash', 'SummonerDot'],
      3: ['SummonerFlash', 'SummonerHeal'],
      4: ['SummonerFlash', 'SummonerDot'],
      5: ['SummonerFlash', 'SummonerTeleport'],
      6: ['SummonerFlash', 'SummonerSmite'],
      7: ['SummonerFlash', 'SummonerDot'],
      8: ['SummonerFlash', 'SummonerHeal'],
      9: ['SummonerFlash', 'SummonerDot'],
    };
    const mk = (championId: number, index: number, isEnemy: boolean): LivePlayer => {
      const s = this.scores.get(index) ?? { kills: 0, deaths: 0, assists: 0 };
      const mock = !isEnemy ? MOCK_ALLIES[index] : null;
      return {
        index,
        team: isEnemy ? 'CHAOS' : 'ORDER',
        isEnemy,
        riotId: mock ? `${mock.gameName}#${mock.tagLine}` : `Ennemi ${index - 4}`,
        championId,
        level: Math.min(18, 1 + Math.floor(gameTime / 95) + (index % 3 === 0 ? 1 : 0)),
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        isDead: false,
        respawnIn: 0,
        spells: SPELLS[index] ?? ['SummonerFlash', 'SummonerDot'],
      };
    };
    return [
      ...ALLY_COMP.map((c, i) => mk(c, i, false)),
      ...ENEMY_COMP.map((c, i) => mk(c, i + 5, true)),
    ];
  }

  /* ---- hooks des événements scriptés ---- */

  score(killerIdx: number, killerStat: 'kills' | 'deaths', victimIdx: number, victimStat: 'kills' | 'deaths'): void {
    const bump = (idx: number, stat: 'kills' | 'deaths') => {
      const s = this.scores.get(idx) ?? { kills: 0, deaths: 0, assists: 0 };
      s[stat] += 1;
      this.scores.set(idx, s);
    };
    bump(killerIdx, killerStat);
    bump(victimIdx, victimStat);
  }

  autoFlash(playerIdx: number): void {
    if (!this.store.getSettings().live.flashTimers) return;
    this.store.startTimer({
      kind: 'FLASH',
      refKey: `spell:${playerIdx}:0`, // slot 0 = flash dans le scénario
      label: 'FLASH',
      durationMs: FLASH_CD_SEC * 1000,
      auto: true,
    });
  }

  autoUlt(playerIdx: number): void {
    if (!this.store.getSettings().live.ultTimers) return;
    const player = this.store.snapshot().live?.players.find((p) => p.index === playerIdx);
    if (!player) return;
    const cd = ultCooldownSeconds(player.championId, player.level) ?? 100;
    this.store.startTimer({
      kind: 'ULT',
      refKey: `ult:${playerIdx}`,
      label: 'R',
      durationMs: cd * 1000,
      auto: true,
    });
  }

  autoObjective(id: string): void {
    if (!this.store.getSettings().live.objectiveTimers) return;
    const def = OBJECTIVE_BY_ID.get(id);
    if (!def) return;
    this.store.startTimer({
      kind: 'OBJECTIVE',
      refKey: `obj:${id}`,
      label: def.short,
      durationMs: def.respawnSec * 1000,
      auto: true,
    });
  }

  autoCamp(id: string): void {
    if (!this.store.getSettings().live.campTimers) return;
    const def = CAMP_BY_ID.get(id);
    if (!def) return;
    this.store.startTimer({
      kind: 'CAMP',
      refKey: `camp:${id}`,
      label: def.label,
      durationMs: def.respawnSec * 1000,
      auto: true,
    });
  }
}
