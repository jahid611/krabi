import https from 'node:https';
import {
  CHAMPIONS,
  OBJECTIVE_BY_ID,
  formatClock,
  type LiveEvent,
  type LivePlayer,
} from '@krabi/shared';
import type { Store } from '../store.js';

/* ---- formes (partielles) de l'API Live Client Data (port 2999) ---- */

interface RawPlayer {
  riotId?: string;
  summonerName?: string;
  championName: string;
  team: 'ORDER' | 'CHAOS';
  level: number;
  isDead: boolean;
  respawnTimer: number;
  scores: { kills: number; deaths: number; assists: number };
  summonerSpells?: {
    summonerSpellOne?: { rawDisplayName?: string; displayName?: string };
    summonerSpellTwo?: { rawDisplayName?: string; displayName?: string };
  };
}

interface RawEvent {
  EventID: number;
  EventName: string;
  EventTime: number;
  KillerName?: string;
  VictimName?: string;
  DragonType?: string;
}

interface AllGameData {
  activePlayer?: { riotId?: string; summonerName?: string };
  allPlayers: RawPlayer[];
  events: { Events: RawEvent[] };
  gameData: { gameTime: number };
}

const NAME_TO_KEY = new Map(
  CHAMPIONS.map((c) => [c.name.toLowerCase().replace(/[^a-z0-9]/g, ''), c.key]),
);

function championKeyFromName(name: string): number {
  return NAME_TO_KEY.get(name.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? 0;
}

function spellKey(spell?: { rawDisplayName?: string; displayName?: string }): string {
  const raw = spell?.rawDisplayName ?? '';
  const match = raw.match(/Summoner[A-Za-z]+/);
  return match?.[0] ?? spell?.displayName ?? '';
}

/**
 * Poller de l'API Live Client Data exposée par le jeu (https://127.0.0.1:2999).
 * Alimente le feed d'événements et démarre automatiquement les timers
 * d'objectifs (dragon / baron / héraut) à partir des événements du jeu.
 */
export class LivePoller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private seenEvents = new Set<number>();
  private feed: LiveEvent[] = [];
  private wasActive = false;

  constructor(private store: Store) {}

  start(): void {
    this.timer = setInterval(() => void this.tick(), 1000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.store.getSettings().demoMode) return; // le simulateur pilote l'état

    let data: AllGameData;
    try {
      data = await fetchAllGameData();
    } catch {
      if (this.wasActive) {
        this.wasActive = false;
        this.seenEvents.clear();
        this.feed = [];
        this.store.setLive(null);
        this.store.setStatus({ liveData: false });
        this.store.clearTimers();
      }
      return;
    }

    this.wasActive = true;
    const activeId = data.activePlayer?.riotId ?? data.activePlayer?.summonerName ?? '';
    const myTeam = data.allPlayers.find(
      (p) => (p.riotId ?? p.summonerName) === activeId,
    )?.team;

    const players: LivePlayer[] = data.allPlayers.map((p, index) => ({
      index,
      team: p.team,
      isEnemy: myTeam ? p.team !== myTeam : p.team === 'CHAOS',
      riotId: p.riotId ?? p.summonerName ?? `Joueur ${index + 1}`,
      championId: championKeyFromName(p.championName),
      level: p.level,
      kills: p.scores.kills,
      deaths: p.scores.deaths,
      assists: p.scores.assists,
      isDead: p.isDead,
      respawnIn: Math.ceil(p.respawnTimer),
      spells: [spellKey(p.summonerSpells?.summonerSpellOne), spellKey(p.summonerSpells?.summonerSpellTwo)],
    }));

    for (const ev of data.events.Events) {
      if (this.seenEvents.has(ev.EventID)) continue;
      this.seenEvents.add(ev.EventID);
      this.ingestEvent(ev);
    }

    this.store.setStatus({ liveData: true, gameflow: 'INGAME' });
    this.store.setLive({
      gameTimeSec: Math.floor(data.gameData.gameTime),
      players,
      events: this.feed.slice(-60),
    });
  }

  private ingestEvent(ev: RawEvent): void {
    const settings = this.store.getSettings();
    const push = (tag: string, detail: string) =>
      this.feed.push({ id: ev.EventID, timeSec: Math.floor(ev.EventTime), tag, detail });

    switch (ev.EventName) {
      case 'ChampionKill':
        push('KILL', `${ev.KillerName ?? '?'} ▸ ${ev.VictimName ?? '?'}`);
        break;
      case 'DragonKill':
        push('OBJ', `DRAGON ${ev.DragonType ?? ''} ▸ ${ev.KillerName ?? ''}`.trim());
        this.autoObjective('dragon', settings.live.objectiveTimers);
        break;
      case 'BaronKill':
        push('OBJ', `BARON ▸ ${ev.KillerName ?? ''}`.trim());
        this.autoObjective('baron', settings.live.objectiveTimers);
        break;
      case 'HeraldKill':
        push('OBJ', `HÉRAUT ▸ ${ev.KillerName ?? ''}`.trim());
        break;
      case 'TurretKilled':
        push('TOUR', `tour détruite ▸ ${ev.KillerName ?? ''}`.trim());
        break;
      case 'InhibKilled':
        push('INHIB', `inhibiteur détruit ▸ ${ev.KillerName ?? ''}`.trim());
        break;
      case 'GameStart':
        push('START', `partie lancée · sync ${formatClock(ev.EventTime)}`);
        break;
      default:
        break;
    }
  }

  private autoObjective(id: string, enabled: boolean): void {
    if (!enabled) return;
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
}

function fetchAllGameData(): Promise<AllGameData> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: '127.0.0.1',
        port: 2999,
        path: '/liveclientdata/allgamedata',
        method: 'GET',
        rejectUnauthorized: false, // certificat auto-signé Riot, loopback uniquement
        timeout: 1500,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`live client ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body) as AllGameData);
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('live client timeout')));
    req.end();
  });
}
