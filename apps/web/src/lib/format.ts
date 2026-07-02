import type { RankInfo } from '@krabi/shared';

export { formatClock } from '@krabi/shared';

const TIER_SHORT: Record<string, string> = {
  IRON: 'FER', BRONZE: 'BRZ', SILVER: 'ARG', GOLD: 'OR', PLATINUM: 'PLAT',
  EMERALD: 'EME', DIAMOND: 'DIA', MASTER: 'MASTER', GRANDMASTER: 'GM',
  CHALLENGER: 'CHALL', UNRANKED: 'UNRANKED',
};

const TIER_COLOR: Record<string, string> = {
  IRON: '#8a8a8a', BRONZE: '#b0793f', SILVER: '#b8c4cc', GOLD: '#e8c25a',
  PLATINUM: '#3fc9b0', EMERALD: '#41ff83', DIAMOND: '#4fb6ff', MASTER: '#c76bff',
  GRANDMASTER: '#ff5a5a', CHALLENGER: '#ffd75a', UNRANKED: '#666',
};

export function formatRank(rank: RankInfo): string {
  const tier = TIER_SHORT[rank.tier] ?? rank.tier;
  if (rank.tier === 'UNRANKED') return tier;
  const div = rank.division ? ` ${rank.division}` : '';
  return `${tier}${div} · ${rank.lp}LP`;
}

export function rankColor(rank: RankInfo): string {
  return TIER_COLOR[rank.tier] ?? '#888';
}

/* ============================================================
   Assets du jeu — vraies icônes chargées côté navigateur.
   Chaque usage passe par une chaîne de fallback (voir ImgChain) :
   1. fichier local `apps/web/public/game/…` s'il existe,
   2. CDN Riot / CommunityDragon,
   3. pastille texte.
   ============================================================ */

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/14.24.1/img';
const CDRAGON_MINIMAP = 'https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons';

/** URL d'icône champion (Data Dragon). */
export function championImageUrl(ddragonId: string): string {
  return `${DDRAGON}/champion/${ddragonId}.png`;
}

/** Icône d'un sort d'invocateur (SummonerFlash, SummonerDot, …). */
export function spellIconSrcs(spellId: string): string[] {
  return [`/game/${spellId}.png`, `${DDRAGON}/spell/${spellId}.png`];
}

export const FLASH_ICON_SRCS = spellIconSrcs('SummonerFlash');

/** Icône de l'ultime d'un champion (CommunityDragon, endpoint documenté). */
export function ultIconSrcs(championKey: number): string[] {
  return [
    `/game/ult-${championKey}.png`,
    `https://cdn.communitydragon.org/latest/champion/${championKey}/ability-icon/ultimate`,
  ];
}

/** Icônes minimap des camps / objectifs (blue buff, red buff, dragon, baron…). */
const CAMP_ICON_FILES: Record<string, string> = {
  blue_buff: 'blue_minimap_icon.png',
  red_buff: 'red_minimap_icon.png',
  gromp: 'gromp_minimap_icon.png',
  wolves: 'wolf_minimap_icon.png',
  raptors: 'raptor_minimap_icon.png',
  krugs: 'krug_minimap_icon.png',
  scuttle: 'scuttlecrab_minimap_icon.png',
  dragon: 'dragon_minimap_icon.png',
  baron: 'baron_minimap_icon.png',
  herald: 'riftherald_minimap_icon.png',
};

/** Type de camp à partir de l'id (`blue_red` = red buff côté bleu, `scuttle_top`…). */
export function campType(campId: string): string {
  if (campId.startsWith('scuttle')) return 'scuttle';
  const [, camp] = campId.split('_');
  if (camp === 'blue') return 'blue_buff';
  if (camp === 'red') return 'red_buff';
  return camp; // gromp / wolves / raptors / krugs
}

export function campIconSrcs(type: string): string[] {
  const file = CAMP_ICON_FILES[type];
  return [`/game/${type}.png`, ...(file ? [`${CDRAGON_MINIMAP}/${file}`] : [])];
}
