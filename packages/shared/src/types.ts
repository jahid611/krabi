/** Phases du gameflow LCU, réduites à ce que l'app affiche. */
export type GamePhase = 'IDLE' | 'LOBBY' | 'CHAMPSELECT' | 'INGAME' | 'POSTGAME';

export type DamageType = 'AD' | 'AP' | 'HYBRID';
export type TeamSide = 'ALLY' | 'ENEMY';

export interface RankInfo {
  tier: string;      // IRON..CHALLENGER, ou UNRANKED
  division: string;  // I..IV, '' pour apex tiers
  lp: number;
  winrate?: number;  // saison, 0..100
}

/** Forme récente : 5 dernières parties, la plus récente en premier. */
export interface RecentForm {
  results: boolean[]; // true = win
  wins: number;
  losses: number;
}

export type SlotState = 'WAITING' | 'BANNING' | 'PICKING' | 'LOCKED';

export interface PlayerSlot {
  cellId: number;
  side: TeamSide;
  position: string; // TOP | JUNGLE | MIDDLE | BOTTOM | UTILITY | ''
  championId: number; // 0 = aucun pick
  isSelf: boolean;
  state: SlotState;
  gameName?: string;
  tagLine?: string;
  rank?: RankInfo;
  form?: RecentForm;
  opggUrl?: string;
}

export interface BanSlot {
  side: TeamSide;
  championId: number; // 0 = ban à venir / no-ban
}

export interface ChampSelectState {
  phaseLabel: string;   // BAN PHASE / PICK PHASE / FINALISATION
  timerMs: number;      // temps restant de la phase courante
  allies: PlayerSlot[];
  enemies: PlayerSlot[];
  bans: BanSlot[];
}

export type AlertSeverity = 'INFO' | 'WARN' | 'CRIT';

export interface CompAlert {
  severity: AlertSeverity;
  code: string;
  message: string;
  suggestions?: string[]; // ids de champions conseillés
}

export interface TeamAnalysis {
  side: TeamSide;
  pickedCount: number;
  adCount: number;
  apCount: number;
  hybridCount: number;
  physicalShare: number; // 0..1, hybride compté 50/50
  magicShare: number;    // 0..1
  ccLockSeconds: number; // somme approx. de CC dur du kit de chaque pick
  alerts: CompAlert[];
}

export type TimerKind = 'FLASH' | 'ULT' | 'CAMP' | 'OBJECTIVE';

export interface TrackerTimer {
  id: string;
  kind: TimerKind;
  refKey: string;    // clé stable : flash:<idx> | ult:<idx> | camp:<campId> | obj:<objId>
  label: string;
  startedAt: number; // epoch ms serveur
  expiresAt: number; // epoch ms serveur
  durationMs: number;
  auto: boolean;     // démarré par un événement live (vs clic manuel)
}

export interface LivePlayer {
  index: number;          // 0..9, ordre live client data
  team: 'ORDER' | 'CHAOS';
  isEnemy: boolean;       // relatif au joueur actif
  riotId: string;
  championId: number;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  isDead: boolean;
  respawnIn: number;      // secondes
  spells: [string, string];
}

export interface LiveEvent {
  id: number;
  timeSec: number;
  tag: string;    // KILL / DEATH / OBJ / WARD / FLASH / ULT ...
  detail: string;
}

export interface LiveGameState {
  gameTimeSec: number;
  players: LivePlayer[];
  events: LiveEvent[]; // derniers événements, plus ancien en premier
}

export interface ConnectionStatus {
  lcu: boolean;
  liveData: boolean;
  demo: boolean;
  gameflow: GamePhase;
  region?: string; // ex. euw — utilisé pour les liens op.gg
}

export interface AppSettings {
  demoMode: boolean;
  accentColor: string;
  scanlines: boolean;
  draft: {
    showElo: boolean;
    showForm: boolean;
    showOpgg: boolean;
    damageAnalysis: boolean;
    ccAnalysis: boolean;
    compAlerts: boolean;
  };
  live: {
    flashTimers: boolean;
    ultTimers: boolean;
    campTimers: boolean;
    objectiveTimers: boolean;
    eventFeed: boolean;
  };
}

export interface AppState {
  serverTime: number; // epoch ms — permet au client de calculer un offset d'horloge
  status: ConnectionStatus;
  champSelect: ChampSelectState | null;
  analysis: { ally: TeamAnalysis; enemy: TeamAnalysis } | null;
  live: LiveGameState | null;
  timers: TrackerTimer[];
  settings: AppSettings;
}

export type ServerMessage = { type: 'state'; state: AppState };

export type ClientMessage =
  | { type: 'startTimer'; kind: TimerKind; refKey: string; label: string; durationMs: number }
  | { type: 'cancelTimer'; refKey: string }
  | { type: 'updateSettings'; patch: DeepPartial<AppSettings> };

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const DEFAULT_SETTINGS: AppSettings = {
  demoMode: false,
  accentColor: '#41FF83',
  scanlines: true,
  draft: {
    showElo: true,
    showForm: true,
    showOpgg: true,
    damageAnalysis: true,
    ccAnalysis: true,
    compAlerts: true,
  },
  live: {
    flashTimers: true,
    ultTimers: true,
    campTimers: true,
    objectiveTimers: true,
    eventFeed: true,
  },
};
