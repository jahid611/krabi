import type { DamageType } from './types.js';

/**
 * Dataset champions embarqué : [clé LCU, id DDragon, nom affiché, profil de dégâts, CC dur (s), CD d'ult par rang].
 *
 * Les valeurs de CC et de cooldown sont des approximations curatées pour l'analyse
 * de draft et les trackers — pas des stats exactes patch par patch.
 * `scripts/fetch-ddragon.mjs` permet de régénérer clés/cooldowns depuis Data Dragon.
 */
export interface Champion {
  key: number;
  id: string;   // id DDragon, utilisé pour les images
  name: string;
  dmg: DamageType;
  cc: number;   // secondes de CC dur sur une rotation complète
  ult: [number, number, number];
}

type Row = [number, string, string, DamageType, number, [number, number, number]?];

const D: [number, number, number] = [120, 100, 80];

const ROWS: Row[] = [
  [266, 'Aatrox', 'Aatrox', 'AD', 1.0, [120, 100, 80]],
  [103, 'Ahri', 'Ahri', 'AP', 1.4, [130, 105, 80]],
  [84, 'Akali', 'Akali', 'AP', 0, [100, 80, 60]],
  [166, 'Akshan', 'Akshan', 'AD', 0],
  [12, 'Alistar', 'Alistar', 'AP', 3.5],
  [799, 'Ambessa', 'Ambessa', 'AD', 1.0],
  [32, 'Amumu', 'Amumu', 'AP', 3.5, [150, 125, 100]],
  [34, 'Anivia', 'Anivia', 'AP', 1.1, [8, 8, 8]],
  [1, 'Annie', 'Annie', 'AP', 1.5, [120, 100, 80]],
  [523, 'Aphelios', 'Aphelios', 'AD', 0.5],
  [22, 'Ashe', 'Ashe', 'AD', 2.5, [100, 90, 80]],
  [136, 'AurelionSol', 'Aurelion Sol', 'AP', 1.1],
  [893, 'Aurora', 'Aurora', 'AP', 1.0],
  [268, 'Azir', 'Azir', 'AP', 1.0, [140, 120, 100]],
  [432, 'Bard', 'Bard', 'AP', 2.5, [140, 125, 110]],
  [200, 'Belveth', "Bel'Veth", 'AD', 1.2],
  [53, 'Blitzcrank', 'Blitzcrank', 'AP', 2.0],
  [63, 'Brand', 'Brand', 'AP', 1.5],
  [201, 'Braum', 'Braum', 'AP', 3.0],
  [233, 'Briar', 'Briar', 'AD', 1.8],
  [51, 'Caitlyn', 'Caitlyn', 'AD', 1.5, [90, 75, 60]],
  [164, 'Camille', 'Camille', 'AD', 1.0, [140, 115, 90]],
  [69, 'Cassiopeia', 'Cassiopeia', 'AP', 2.0],
  [31, 'Chogath', "Cho'Gath", 'AP', 2.6, [80, 70, 60]],
  [42, 'Corki', 'Corki', 'HYBRID', 0],
  [122, 'Darius', 'Darius', 'AD', 0.8, [100, 80, 60]],
  [131, 'Diana', 'Diana', 'AP', 1.4, [100, 85, 70]],
  [36, 'DrMundo', 'Dr. Mundo', 'AD', 0.5],
  [119, 'Draven', 'Draven', 'AD', 0.5],
  [245, 'Ekko', 'Ekko', 'AP', 2.2, [110, 90, 70]],
  [60, 'Elise', 'Elise', 'AP', 1.6],
  [28, 'Evelynn', 'Evelynn', 'AP', 1.5, [120, 100, 80]],
  [81, 'Ezreal', 'Ezreal', 'HYBRID', 0, [120, 105, 90]],
  [9, 'Fiddlesticks', 'Fiddlesticks', 'AP', 3.7, [140, 110, 80]],
  [114, 'Fiora', 'Fiora', 'AD', 0.5, [110, 90, 70]],
  [105, 'Fizz', 'Fizz', 'AP', 1.5, [100, 85, 70]],
  [3, 'Galio', 'Galio', 'AP', 3.2, [160, 140, 120]],
  [41, 'Gangplank', 'Gangplank', 'AD', 0, [140, 130, 120]],
  [86, 'Garen', 'Garen', 'AD', 0.5, [120, 100, 80]],
  [150, 'Gnar', 'Gnar', 'AD', 2.7, [90, 60, 30]],
  [79, 'Gragas', 'Gragas', 'AP', 2.6, [100, 85, 70]],
  [104, 'Graves', 'Graves', 'AD', 0, [120, 100, 80]],
  [887, 'Gwen', 'Gwen', 'AP', 0, [120, 100, 80]],
  [120, 'Hecarim', 'Hecarim', 'AD', 1.8, [140, 120, 100]],
  [74, 'Heimerdinger', 'Heimerdinger', 'AP', 1.3],
  [910, 'Hwei', 'Hwei', 'AP', 2.0, [160, 140, 120]],
  [420, 'Illaoi', 'Illaoi', 'AD', 0.5, [120, 105, 90]],
  [39, 'Irelia', 'Irelia', 'AD', 1.5, [140, 120, 100]],
  [427, 'Ivern', 'Ivern', 'AP', 2.0],
  [40, 'Janna', 'Janna', 'AP', 2.0, [150, 135, 120]],
  [59, 'JarvanIV', 'Jarvan IV', 'AD', 1.4, [120, 105, 90]],
  [24, 'Jax', 'Jax', 'HYBRID', 1.0, [100, 90, 80]],
  [126, 'Jayce', 'Jayce', 'AD', 0],
  [202, 'Jhin', 'Jhin', 'AD', 1.0, [120, 105, 90]],
  [222, 'Jinx', 'Jinx', 'AD', 1.4, [85, 65, 45]],
  [897, 'KSante', "K'Sante", 'AD', 2.8, [120, 100, 80]],
  [145, 'Kaisa', "Kai'Sa", 'HYBRID', 0, [130, 100, 70]],
  [429, 'Kalista', 'Kalista', 'AD', 1.5, [150, 135, 120]],
  [43, 'Karma', 'Karma', 'AP', 1.6],
  [30, 'Karthus', 'Karthus', 'AP', 0, [200, 180, 160]],
  [38, 'Kassadin', 'Kassadin', 'AP', 0.6],
  [55, 'Katarina', 'Katarina', 'AP', 0, [90, 60, 45]],
  [10, 'Kayle', 'Kayle', 'HYBRID', 0, [160, 120, 80]],
  [141, 'Kayn', 'Kayn', 'AD', 1.3, [120, 100, 80]],
  [85, 'Kennen', 'Kennen', 'AP', 2.4, [120, 100, 80]],
  [121, 'Khazix', "Kha'Zix", 'AD', 0, [100, 85, 70]],
  [203, 'Kindred', 'Kindred', 'AD', 0, [160, 130, 100]],
  [240, 'Kled', 'Kled', 'AD', 1.0, [160, 140, 120]],
  [96, 'KogMaw', "Kog'Maw", 'HYBRID', 0.5],
  [7, 'Leblanc', 'LeBlanc', 'AP', 1.5, [60, 45, 30]],
  [64, 'LeeSin', 'Lee Sin', 'AD', 1.0, [110, 85, 60]],
  [89, 'Leona', 'Leona', 'AP', 4.0, [90, 75, 60]],
  [876, 'Lillia', 'Lillia', 'AP', 1.5, [130, 110, 90]],
  [127, 'Lissandra', 'Lissandra', 'AP', 3.0, [120, 100, 80]],
  [236, 'Lucian', 'Lucian', 'AD', 0, [110, 100, 90]],
  [117, 'Lulu', 'Lulu', 'AP', 1.8, [110, 95, 80]],
  [99, 'Lux', 'Lux', 'AP', 2.0, [80, 70, 60]],
  [54, 'Malphite', 'Malphite', 'AP', 2.0, [130, 105, 80]],
  [90, 'Malzahar', 'Malzahar', 'AP', 2.5, [140, 110, 80]],
  [57, 'Maokai', 'Maokai', 'AP', 3.4, [120, 100, 80]],
  [11, 'MasterYi', 'Master Yi', 'AD', 0, [100, 90, 80]],
  [800, 'Mel', 'Mel', 'AP', 1.2, [120, 100, 80]],
  [902, 'Milio', 'Milio', 'AP', 1.2, [160, 140, 120]],
  [21, 'MissFortune', 'Miss Fortune', 'AD', 0, [120, 100, 80]],
  [62, 'MonkeyKing', 'Wukong', 'AD', 2.0, [130, 110, 90]],
  [82, 'Mordekaiser', 'Mordekaiser', 'AP', 0.8, [140, 120, 100]],
  [25, 'Morgana', 'Morgana', 'AP', 4.0, [120, 100, 80]],
  [950, 'Naafiri', 'Naafiri', 'AD', 0, [120, 100, 80]],
  [267, 'Nami', 'Nami', 'AP', 2.7, [120, 110, 100]],
  [75, 'Nasus', 'Nasus', 'AD', 0, [120, 100, 80]],
  [111, 'Nautilus', 'Nautilus', 'AP', 4.2, [120, 100, 80]],
  [518, 'Neeko', 'Neeko', 'AP', 2.8, [90, 75, 60]],
  [76, 'Nidalee', 'Nidalee', 'AP', 0],
  [895, 'Nilah', 'Nilah', 'AD', 1.2, [120, 100, 80]],
  [56, 'Nocturne', 'Nocturne', 'AD', 1.7, [150, 125, 100]],
  [20, 'Nunu', 'Nunu & Willump', 'AP', 2.5, [110, 100, 90]],
  [2, 'Olaf', 'Olaf', 'AD', 0, [100, 90, 80]],
  [61, 'Orianna', 'Orianna', 'AP', 2.2, [110, 95, 80]],
  [516, 'Ornn', 'Ornn', 'AD', 3.0, [130, 105, 80]],
  [80, 'Pantheon', 'Pantheon', 'AD', 1.5, [180, 165, 150]],
  [78, 'Poppy', 'Poppy', 'AD', 2.7, [140, 120, 100]],
  [555, 'Pyke', 'Pyke', 'AD', 2.1, [120, 100, 80]],
  [246, 'Qiyana', 'Qiyana', 'AD', 1.5, [120, 100, 80]],
  [133, 'Quinn', 'Quinn', 'AD', 0.8],
  [497, 'Rakan', 'Rakan', 'AP', 3.0, [130, 110, 90]],
  [33, 'Rammus', 'Rammus', 'AD', 2.2, [110, 95, 80]],
  [421, 'RekSai', "Rek'Sai", 'AD', 1.0, [100, 85, 70]],
  [526, 'Rell', 'Rell', 'AP', 3.6, [120, 100, 80]],
  [888, 'Renata', 'Renata Glasc', 'AP', 2.3, [150, 130, 110]],
  [58, 'Renekton', 'Renekton', 'AD', 1.5, [120, 100, 80]],
  [107, 'Rengar', 'Rengar', 'AD', 1.0, [110, 95, 80]],
  [92, 'Riven', 'Riven', 'AD', 1.8, [120, 100, 80]],
  [68, 'Rumble', 'Rumble', 'AP', 0, [110, 100, 90]],
  [13, 'Ryze', 'Ryze', 'AP', 0.8, [180, 160, 140]],
  [360, 'Samira', 'Samira', 'AD', 0.6, [8, 8, 8]],
  [113, 'Sejuani', 'Sejuani', 'AP', 3.8, [120, 100, 80]],
  [235, 'Senna', 'Senna', 'AD', 1.0, [160, 140, 120]],
  [147, 'Seraphine', 'Seraphine', 'AP', 2.4, [160, 140, 120]],
  [875, 'Sett', 'Sett', 'AD', 1.8, [120, 100, 80]],
  [35, 'Shaco', 'Shaco', 'HYBRID', 1.5, [100, 90, 80]],
  [98, 'Shen', 'Shen', 'AP', 1.5, [180, 150, 120]],
  [102, 'Shyvana', 'Shyvana', 'HYBRID', 0.9, [100, 85, 70]],
  [27, 'Singed', 'Singed', 'AP', 1.0, [100, 90, 80]],
  [14, 'Sion', 'Sion', 'AD', 3.2, [140, 100, 60]],
  [15, 'Sivir', 'Sivir', 'AD', 0, [120, 100, 80]],
  [72, 'Skarner', 'Skarner', 'AD', 2.8, [120, 100, 80]],
  [901, 'Smolder', 'Smolder', 'HYBRID', 0.5, [120, 100, 80]],
  [37, 'Sona', 'Sona', 'AP', 1.5, [140, 120, 100]],
  [16, 'Soraka', 'Soraka', 'AP', 1.3, [150, 135, 120]],
  [50, 'Swain', 'Swain', 'AP', 2.4, [120, 100, 80]],
  [517, 'Sylas', 'Sylas', 'AP', 1.6, [100, 80, 60]],
  [134, 'Syndra', 'Syndra', 'AP', 1.5, [120, 100, 80]],
  [223, 'TahmKench', 'Tahm Kench', 'AP', 2.4, [120, 100, 80]],
  [163, 'Taliyah', 'Taliyah', 'AP', 1.6, [180, 150, 120]],
  [91, 'Talon', 'Talon', 'AD', 0, [100, 80, 60]],
  [44, 'Taric', 'Taric', 'AP', 2.6, [180, 150, 120]],
  [17, 'Teemo', 'Teemo', 'AP', 0.8],
  [412, 'Thresh', 'Thresh', 'AP', 3.5, [140, 120, 100]],
  [18, 'Tristana', 'Tristana', 'AD', 0.9, [120, 100, 80]],
  [48, 'Trundle', 'Trundle', 'AD', 0, [130, 110, 90]],
  [23, 'Tryndamere', 'Tryndamere', 'AD', 0, [120, 100, 80]],
  [4, 'TwistedFate', 'Twisted Fate', 'AP', 1.8, [180, 150, 120]],
  [29, 'Twitch', 'Twitch', 'AD', 0, [90, 75, 60]],
  [77, 'Udyr', 'Udyr', 'HYBRID', 1.3],
  [6, 'Urgot', 'Urgot', 'AD', 1.5, [100, 85, 70]],
  [110, 'Varus', 'Varus', 'HYBRID', 2.0, [100, 80, 60]],
  [67, 'Vayne', 'Vayne', 'AD', 0.8, [100, 85, 70]],
  [45, 'Veigar', 'Veigar', 'AP', 2.3, [120, 100, 80]],
  [161, 'Velkoz', "Vel'Koz", 'AP', 1.3, [120, 100, 80]],
  [711, 'Vex', 'Vex', 'AP', 2.0, [140, 120, 100]],
  [254, 'Vi', 'Vi', 'AD', 2.6, [140, 115, 90]],
  [234, 'Viego', 'Viego', 'AD', 1.5, [120, 100, 80]],
  [112, 'Viktor', 'Viktor', 'AP', 0.8, [120, 100, 80]],
  [8, 'Vladimir', 'Vladimir', 'AP', 0, [150, 135, 120]],
  [106, 'Volibear', 'Volibear', 'HYBRID', 1.8, [160, 140, 120]],
  [19, 'Warwick', 'Warwick', 'HYBRID', 2.2, [110, 90, 70]],
  [498, 'Xayah', 'Xayah', 'AD', 1.3, [140, 120, 100]],
  [101, 'Xerath', 'Xerath', 'AP', 0.8, [130, 115, 100]],
  [5, 'XinZhao', 'Xin Zhao', 'AD', 1.6, [120, 100, 80]],
  [157, 'Yasuo', 'Yasuo', 'AD', 1.0, [80, 55, 30]],
  [777, 'Yone', 'Yone', 'AD', 1.0, [120, 100, 80]],
  [83, 'Yorick', 'Yorick', 'AD', 0.8, [160, 130, 100]],
  [804, 'Yunara', 'Yunara', 'AD', 0.5, [120, 100, 80]],
  [350, 'Yuumi', 'Yuumi', 'AP', 1.5, [110, 100, 90]],
  [154, 'Zac', 'Zac', 'AP', 3.4, [120, 100, 80]],
  [238, 'Zed', 'Zed', 'AD', 0, [120, 100, 80]],
  [221, 'Zeri', 'Zeri', 'AD', 0.7, [100, 85, 70]],
  [115, 'Ziggs', 'Ziggs', 'AP', 1.2, [120, 105, 90]],
  [26, 'Zilean', 'Zilean', 'AP', 2.2, [120, 100, 80]],
  [142, 'Zoe', 'Zoe', 'AP', 2.2, [120, 100, 80]],
  [143, 'Zyra', 'Zyra', 'AP', 2.4, [110, 100, 90]],
];

export const CHAMPIONS: Champion[] = ROWS.map(([key, id, name, dmg, cc, ult]) => ({
  key,
  id,
  name,
  dmg,
  cc,
  ult: ult ?? D,
}));

const BY_KEY = new Map<number, Champion>(CHAMPIONS.map((c) => [c.key, c]));
const BY_ID = new Map<string, Champion>(CHAMPIONS.map((c) => [c.id, c]));

export function championByKey(key: number): Champion | undefined {
  return BY_KEY.get(key);
}

export function championById(id: string): Champion | undefined {
  return BY_ID.get(id);
}

/** Rang d'ult estimé selon le niveau (6/11/16). */
export function ultRankForLevel(level: number): 0 | 1 | 2 {
  return level >= 16 ? 2 : level >= 11 ? 1 : 0;
}

export function ultCooldownSeconds(championKey: number, level: number): number | null {
  const champ = BY_KEY.get(championKey);
  if (!champ || level < 6) return null;
  return champ.ult[ultRankForLevel(level)];
}

/** Pools de suggestions pour les alertes de compo (picks solides et flexibles). */
export const AP_SUGGESTIONS = [
  'Ahri', 'Orianna', 'Viktor', 'Hwei', 'Syndra', 'Gwen', 'Diana', 'Lillia',
  'Vex', 'Galio', 'Malphite', 'Amumu', 'Gragas', 'Neeko', 'Seraphine',
];

export const AD_SUGGESTIONS = [
  'Aatrox', 'Jhin', 'MissFortune', 'LeeSin', 'Vi', 'XinZhao', 'Camille',
  'Renekton', 'Lucian', 'Varus', 'JarvanIV', 'Riven',
];

export const CC_SUGGESTIONS = [
  'Leona', 'Nautilus', 'Rell', 'Thresh', 'Amumu', 'Sejuani', 'Maokai',
  'Rakan', 'Vi', 'JarvanIV', 'Alistar', 'Morgana',
];
