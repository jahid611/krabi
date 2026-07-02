import {
  analyzeTeam,
  DEFAULT_SETTINGS,
  type AppSettings,
  type AppState,
  type ChampSelectState,
  type ConnectionStatus,
  type DeepPartial,
  type LiveGameState,
  type TrackerTimer,
} from '@krabi/shared';

type Listener = (state: AppState) => void;

/**
 * Store central de l'application, côté serveur (source de vérité unique).
 * Toute mutation passe par les méthodes ci-dessous et déclenche un broadcast
 * throttlé vers les clients WebSocket.
 */
export class Store {
  private status: ConnectionStatus = { lcu: false, liveData: false, demo: false, gameflow: 'IDLE' };
  private champSelect: ChampSelectState | null = null;
  private live: LiveGameState | null = null;
  private timers = new Map<string, TrackerTimer>();
  private settings: AppSettings = structuredClone(DEFAULT_SETTINGS);
  private listeners = new Set<Listener>();
  private pending: ReturnType<typeof setTimeout> | null = null;
  private timerSeq = 0;

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot(): AppState {
    const cs = this.champSelect;
    const analysis = cs
      ? (() => {
          const unavailable = new Set<number>([
            ...cs.bans.map((b) => b.championId),
            ...cs.allies.map((p) => p.championId),
            ...cs.enemies.map((p) => p.championId),
          ]);
          unavailable.delete(0);
          return {
            ally: analyzeTeam('ALLY', cs.allies.map((p) => p.championId), unavailable),
            enemy: analyzeTeam('ENEMY', cs.enemies.map((p) => p.championId), unavailable),
          };
        })()
      : null;

    return {
      serverTime: Date.now(),
      status: { ...this.status },
      champSelect: cs,
      analysis,
      live: this.live,
      timers: [...this.timers.values()],
      settings: this.settings,
    };
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  setSettings(settings: AppSettings): void {
    this.settings = settings;
    this.emit();
  }

  patchSettings(patch: DeepPartial<AppSettings>): AppSettings {
    this.settings = deepMerge(this.settings, patch);
    this.emit();
    return this.settings;
  }

  setStatus(patch: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...patch };
    this.emit();
  }

  setChampSelect(cs: ChampSelectState | null): void {
    this.champSelect = cs;
    this.emit();
  }

  setLive(live: LiveGameState | null): void {
    this.live = live;
    this.emit();
  }

  /** Démarre (ou remplace) un timer ; refKey est unique par cible trackée. */
  startTimer(t: Omit<TrackerTimer, 'id' | 'startedAt' | 'expiresAt'>): TrackerTimer {
    const now = Date.now();
    const timer: TrackerTimer = {
      ...t,
      id: `t${++this.timerSeq}`,
      startedAt: now,
      expiresAt: now + t.durationMs,
    };
    this.timers.set(t.refKey, timer);
    this.emit();
    return timer;
  }

  cancelTimer(refKey: string): void {
    if (this.timers.delete(refKey)) this.emit();
  }

  clearTimers(kind?: TrackerTimer['kind']): void {
    if (!kind) this.timers.clear();
    else for (const [k, t] of this.timers) if (t.kind === kind) this.timers.delete(k);
    this.emit();
  }

  /** Purge les timers expirés depuis > 5s (le client affiche 00:00 entre-temps). */
  prune(): void {
    const cutoff = Date.now() - 5000;
    let dirty = false;
    for (const [k, t] of this.timers) {
      if (t.expiresAt < cutoff) {
        this.timers.delete(k);
        dirty = true;
      }
    }
    if (dirty) this.emit();
  }

  private emit(): void {
    if (this.pending) return;
    this.pending = setTimeout(() => {
      this.pending = null;
      const snap = this.snapshot();
      for (const l of this.listeners) l(snap);
    }, 80);
  }
}

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const [key, value] of Object.entries(patch as object)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMerge(out[key] ?? {}, value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}
