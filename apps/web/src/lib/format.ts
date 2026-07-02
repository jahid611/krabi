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

/** URL d'icône champion (Data Dragon, chargée par le navigateur, fallback géré à l'affichage). */
export function championImageUrl(ddragonId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${ddragonId}.png`;
}
