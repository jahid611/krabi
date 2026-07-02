import type { ReactNode } from 'react';
import type { AppSettings, DeepPartial } from '@krabi/shared';
import { useApp } from '../lib/store';
import { CardHead, PageHead, Switch } from '../components/ui';

export function SettingsPage() {
  const { state, patchSettings } = useApp();
  const settings = state?.settings;

  if (!settings) {
    return <PageHead title="Réglages" subtitle="Chargement…" />;
  }

  const patch = (p: DeepPartial<AppSettings>) => patchSettings(p);

  return (
    <>
      <PageHead
        title="Réglages"
        subtitle="Chaque module s'active ou se coupe individuellement — appliqué instantanément."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, paddingBottom: 56 }}>
        <div className="card">
          <CardHead title="Général" />
          <Row
            label="Mode démo"
            desc="Découvre l'app avec une draft et une partie simulées en boucle."
            control={<Switch value={settings.demoMode} onChange={(v) => patch({ demoMode: v })} />}
          />
        </div>

        <div className="card">
          <CardHead title="Draft" />
          <Row
            label="Elo des joueurs"
            desc="Le rang solo/duo de tes alliés pendant la champ select."
            control={<Switch value={settings.draft.showElo} onChange={(v) => patch({ draft: { showElo: v } })} />}
          />
          <Row
            label="Forme — 5 dernières ranked"
            desc="Victoires, défaites et winrate des 5 dernières parties classées de chaque allié."
            control={<Switch value={settings.draft.showForm} onChange={(v) => patch({ draft: { showForm: v } })} />}
          />
          <Row
            label="Liens op.gg"
            desc="Ouvre le profil op.gg de chaque allié dans un nouvel onglet."
            control={<Switch value={settings.draft.showOpgg} onChange={(v) => patch({ draft: { showOpgg: v } })} />}
          />
          <Row
            label="Répartition AD / AP"
            desc="Barre de dégâts physiques et magiques de chaque équipe."
            control={<Switch value={settings.draft.damageAnalysis} onChange={(v) => patch({ draft: { damageAnalysis: v } })} />}
          />
          <Row
            label="Analyse CC"
            desc="Secondes de contrôle par champion et total par équipe."
            control={<Switch value={settings.draft.ccAnalysis} onChange={(v) => patch({ draft: { ccAnalysis: v } })} />}
          />
          <Row
            label="Alertes de compo"
            desc="Full AD/AP, manque de CC… avec des suggestions de picks pour compenser."
            control={<Switch value={settings.draft.compAlerts} onChange={(v) => patch({ draft: { compAlerts: v } })} />}
          />
        </div>

        <div className="card">
          <CardHead title="En jeu" />
          <Row
            label="Timers de sorts d'invocateur"
            desc="Flash, TP, ignite… un clic sur l'icône quand l'ennemi utilise son sort."
            control={<Switch value={settings.live.flashTimers} onChange={(v) => patch({ live: { flashTimers: v } })} />}
          />
          <Row
            label="Timers d'ult"
            desc="Cooldown d'ult estimé selon le niveau de chaque ennemi."
            control={<Switch value={settings.live.ultTimers} onChange={(v) => patch({ live: { ultTimers: v } })} />}
          />
          <Row
            label="Timers de camps"
            desc="Carte cliquable : buffs, camps et sentinelles, placés au bon endroit."
            control={<Switch value={settings.live.campTimers} onChange={(v) => patch({ live: { campTimers: v } })} />}
          />
          <Row
            label="Timers d'objectifs"
            desc="Dragon, Baron, Héraut — démarrés automatiquement."
            control={<Switch value={settings.live.objectiveTimers} onChange={(v) => patch({ live: { objectiveTimers: v } })} />}
          />
          <Row
            label="Fil des événements"
            desc="Kills, objectifs, wards et flashs de ta partie, en direct."
            control={<Switch value={settings.live.eventFeed} onChange={(v) => patch({ live: { eventFeed: v } })} />}
          />
        </div>
      </div>
    </>
  );
}

function Row({ label, desc, control }: { label: string; desc: string; control: ReactNode }) {
  return (
    <div className="setting-row">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{label}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
      </div>
      {control}
    </div>
  );
}
