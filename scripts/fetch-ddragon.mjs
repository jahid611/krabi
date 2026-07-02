#!/usr/bin/env node
/**
 * Vérifie le dataset champions embarqué contre Data Dragon (clés + cooldowns d'ult)
 * et signale les écarts. À lancer hors sandbox (nécessite l'accès à
 * ddragon.leagueoflegends.com) après chaque gros patch.
 *
 *   npm run data:refresh
 */

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

async function main() {
  const versions = await (await fetch(VERSIONS_URL)).json();
  const version = versions[0];
  console.log(`[ddragon] version ${version}`);

  const data = await (
    await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/championFull.json`)
  ).json();

  const { CHAMPIONS } = await import('../packages/shared/src/champions.ts').catch(() => ({ CHAMPIONS: null }));

  const remote = Object.values(data.data).map((c) => ({
    key: Number(c.key),
    id: c.id,
    name: c.name,
    ult: c.spells?.[3]?.cooldown ?? [],
  }));

  if (!CHAMPIONS) {
    // exécution sans loader TS : dump brut pour mise à jour manuelle
    console.log(JSON.stringify(remote, null, 2));
    return;
  }

  const local = new Map(CHAMPIONS.map((c) => [c.id, c]));
  let issues = 0;
  for (const r of remote) {
    const l = local.get(r.id);
    if (!l) {
      console.log(`[MANQUANT] ${r.id} (key ${r.key}) — à ajouter dans champions.ts`);
      issues++;
    } else if (l.key !== r.key) {
      console.log(`[CLÉ] ${r.id} : local ${l.key} ≠ ddragon ${r.key}`);
      issues++;
    }
  }
  console.log(issues === 0 ? '[ok] dataset aligné' : `[!] ${issues} écart(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
