import { championByKey, AP_SUGGESTIONS, AD_SUGGESTIONS, CC_SUGGESTIONS, championById } from './champions.js';
import type { CompAlert, TeamAnalysis, TeamSide } from './types.js';

/**
 * Moteur d'analyse de composition — fonctions pures, partagées serveur/client.
 * Hybride compté 0.5 physique / 0.5 magique.
 */
export function analyzeTeam(
  side: TeamSide,
  championIds: number[],
  unavailableIds: Set<number>,
): TeamAnalysis {
  const picked = championIds.filter((id) => id > 0);
  let ad = 0;
  let ap = 0;
  let hybrid = 0;
  let cc = 0;

  for (const key of picked) {
    const champ = championByKey(key);
    if (!champ) continue;
    if (champ.dmg === 'AD') ad += 1;
    else if (champ.dmg === 'AP') ap += 1;
    else hybrid += 1;
    cc += champ.cc;
  }

  const total = ad + ap + hybrid;
  const physicalShare = total === 0 ? 0 : (ad + hybrid * 0.5) / total;
  const magicShare = total === 0 ? 0 : (ap + hybrid * 0.5) / total;

  const alerts = buildAlerts(side, { picked: total, ad, ap, hybrid, cc }, unavailableIds);

  return {
    side,
    pickedCount: total,
    adCount: ad,
    apCount: ap,
    hybridCount: hybrid,
    physicalShare,
    magicShare,
    ccLockSeconds: Math.round(cc * 100) / 100,
    alerts,
  };
}

interface Counts {
  picked: number;
  ad: number;
  ap: number;
  hybrid: number;
  cc: number;
}

function suggest(pool: string[], unavailable: Set<number>, max = 4): string[] {
  const out: string[] = [];
  for (const id of pool) {
    const champ = championById(id);
    if (!champ || unavailable.has(champ.key)) continue;
    out.push(champ.id);
    if (out.length >= max) break;
  }
  return out;
}

function buildAlerts(side: TeamSide, c: Counts, unavailable: Set<number>): CompAlert[] {
  const alerts: CompAlert[] = [];
  const ally = side === 'ALLY';

  if (c.picked >= 3 && c.ap === 0 && c.hybrid === 0) {
    alerts.push(
      ally
        ? {
            severity: c.picked === 5 ? 'CRIT' : 'WARN',
            code: 'FULL_AD',
            message:
              c.picked === 5
                ? 'COMPO FULL AD — l’ennemi va stack armure. Dis-le à ta team au prochain draft.'
                : 'FULL AD pour l’instant — demande un pick AP ou prends-en un.',
            suggestions: suggest(AP_SUGGESTIONS, unavailable),
          }
        : {
            severity: 'INFO',
            code: 'ENEMY_FULL_AD',
            message: 'Ennemis FULL AD — stack armure (Tabi, Frozen Heart, Randuin).',
          },
    );
  }

  if (c.picked >= 3 && c.ad === 0 && c.hybrid === 0) {
    alerts.push(
      ally
        ? {
            severity: c.picked === 5 ? 'CRIT' : 'WARN',
            code: 'FULL_AP',
            message:
              c.picked === 5
                ? 'COMPO FULL AP — l’ennemi va stack RM. Dis-le à ta team au prochain draft.'
                : 'FULL AP pour l’instant — demande un pick AD ou prends-en un.',
            suggestions: suggest(AD_SUGGESTIONS, unavailable),
          }
        : {
            severity: 'INFO',
            code: 'ENEMY_FULL_AP',
            message: 'Ennemis FULL AP — stack résistance magique (Mercury, Kaenic, Spirit Visage).',
          },
    );
  }

  if (c.picked >= 4 && c.cc < 3) {
    alerts.push(
      ally
        ? {
            severity: 'WARN',
            code: 'LOW_CC',
            message: `CC LOCK faible (${c.cc.toFixed(1)}s) — vise un pick engage/peel.`,
            suggestions: suggest(CC_SUGGESTIONS, unavailable),
          }
        : {
            severity: 'INFO',
            code: 'ENEMY_LOW_CC',
            message: 'Peu de CC en face — les picks mobiles/all-in sont libres.',
          },
    );
  }

  if (!ally && c.picked >= 4 && c.cc >= 8) {
    alerts.push({
      severity: 'WARN',
      code: 'ENEMY_HIGH_CC',
      message: `CC LOCK ennemi élevé (${c.cc.toFixed(1)}s) — pense Cleanse / Mercury / QSS.`,
    });
  }

  if (c.picked === 5 && alerts.length === 0) {
    alerts.push({
      severity: 'INFO',
      code: 'BALANCED',
      message: 'Compo équilibrée — pas d’alerte.',
    });
  }

  return alerts;
}
