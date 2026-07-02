/**
 * Constantes des trackers : camps de jungle (position minimap + respawn),
 * objectifs, et sorts d'invocateur. Positions en fraction de carte,
 * origine en bas à gauche (coordonnées jeu / 14870).
 */

export interface CampDef {
  id: string;
  label: string;
  short: string;
  side: 'BLUE' | 'RED' | 'RIVER';
  x: number; // 0..1, gauche → droite
  y: number; // 0..1, bas → haut
  respawnSec: number;
}

export const CAMPS: CampDef[] = [
  { id: 'blue_blue',    label: 'Blue bleu',      short: 'B',  side: 'BLUE',  x: 0.257, y: 0.545, respawnSec: 300 },
  { id: 'blue_gromp',   label: 'Gromp bleu',     short: 'G',  side: 'BLUE',  x: 0.141, y: 0.566, respawnSec: 135 },
  { id: 'blue_wolves',  label: 'Loups bleu',     short: 'W',  side: 'BLUE',  x: 0.254, y: 0.433, respawnSec: 135 },
  { id: 'blue_raptors', label: 'Raptors bleu',   short: 'R',  side: 'BLUE',  x: 0.467, y: 0.365, respawnSec: 135 },
  { id: 'blue_red',     label: 'Red bleu',       short: 'RD', side: 'BLUE',  x: 0.528, y: 0.273, respawnSec: 300 },
  { id: 'blue_krugs',   label: 'Krugs bleu',     short: 'K',  side: 'BLUE',  x: 0.563, y: 0.183, respawnSec: 135 },
  { id: 'red_blue',     label: 'Blue rouge',     short: 'B',  side: 'RED',   x: 0.749, y: 0.470, respawnSec: 300 },
  { id: 'red_gromp',    label: 'Gromp rouge',    short: 'G',  side: 'RED',   x: 0.854, y: 0.433, respawnSec: 135 },
  { id: 'red_wolves',   label: 'Loups rouge',    short: 'W',  side: 'RED',   x: 0.740, y: 0.564, respawnSec: 135 },
  { id: 'red_raptors',  label: 'Raptors rouge',  short: 'R',  side: 'RED',   x: 0.525, y: 0.637, respawnSec: 135 },
  { id: 'red_red',      label: 'Red rouge',      short: 'RD', side: 'RED',   x: 0.480, y: 0.725, respawnSec: 300 },
  { id: 'red_krugs',    label: 'Krugs rouge',    short: 'K',  side: 'RED',   x: 0.436, y: 0.817, respawnSec: 135 },
  { id: 'scuttle_top',  label: 'Sentinelle top', short: 'S',  side: 'RIVER', x: 0.262, y: 0.688, respawnSec: 150 },
  { id: 'scuttle_bot',  label: 'Sentinelle bot', short: 'S',  side: 'RIVER', x: 0.742, y: 0.318, respawnSec: 150 },
];

export interface ObjectiveDef {
  id: string;
  label: string;
  short: string;
  x: number;
  y: number;
  respawnSec: number;
}

export const OBJECTIVES: ObjectiveDef[] = [
  { id: 'dragon', label: 'Dragon', short: 'DRAKE', x: 0.663, y: 0.297, respawnSec: 300 },
  { id: 'baron',  label: 'Baron',  short: 'BARON', x: 0.337, y: 0.704, respawnSec: 360 },
  { id: 'herald', label: 'Héraut / Grubs', short: 'HERALD', x: 0.337, y: 0.704, respawnSec: 240 },
];

export const CAMP_BY_ID = new Map(CAMPS.map((c) => [c.id, c]));
export const OBJECTIVE_BY_ID = new Map(OBJECTIVES.map((o) => [o.id, o]));

/** Cooldowns des sorts d'invocateur (s). */
export const SUMMONER_SPELLS: Record<string, { label: string; cd: number }> = {
  SummonerFlash:    { label: 'FLASH', cd: 300 },
  SummonerDot:      { label: 'IGNITE', cd: 180 },
  SummonerTeleport: { label: 'TP', cd: 360 },
  SummonerExhaust:  { label: 'EXHAUST', cd: 210 },
  SummonerHeal:     { label: 'HEAL', cd: 240 },
  SummonerBarrier:  { label: 'BARRIER', cd: 180 },
  SummonerBoost:    { label: 'CLEANSE', cd: 210 },
  SummonerHaste:    { label: 'GHOST', cd: 210 },
  SummonerSmite:    { label: 'SMITE', cd: 90 },
};

export const FLASH_CD_SEC = 300;

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
