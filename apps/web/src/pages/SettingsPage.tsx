import type { ReactNode } from 'react';
import type { AppSettings, DeepPartial } from '@krabi/shared';
import { useApp } from '../lib/store';
import { CardHead, PageHead, Switch } from '../components/ui';

const ACCENTS = ['#6a5cff', '#7c3aed', '#2f6bff', '#e5459b'];

export function SettingsPage() {
  const { state, patchSettings } = useApp();
  const settings = state?.settings;

  if (!settings) {
    return (
      <PageHead title="Settings" subtitle="Chargement des réglages…" />
    );
  }

  const patch = (p: DeepPartial<AppSettings>) => patchSettings(p);

  return (
    <>
      <PageHead
        title="Tout est débrayable."
        subtitle="Active ou coupe chaque module individuellement — les réglages sont appliqués en direct et persistés en local."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, paddingBottom: 56 }}>
        <div className="card">
          <CardHead title="Général" />
          <Row
            label="Mode démo"
            desc="Simule une champ select puis une partie complète en boucle — pour tester l'app sans client League."
            control={<Switch value={settings.demoMode} onChange={(v) => patch({ demoMode: v })} />}
          />
          <Row
            label="Thème"
            desc="Sombre à contraste renforcé, ou clair."
            control={
              <div style={{ display: 'flex', gap: 6 }}>
                {(['dark', 'light'] as const).map((theme) => (
                  <button
                    key={theme}
                    className={`btn-ghost${settings.theme === theme ? ' is-ap' : ''}`}
                    onClick={() => patch({ theme })}
                  >
                    {theme === 'dark' ? 'Sombre' : 'Clair'}
                  </button>
                ))}
              </div>
            }
          />
          <Row
            label="Couleur d'accent"
            desc="Teinte principale de l'interface."
            control={
              <div style={{ display: 'flex', gap: 8 }}>
                {ACCENTS.map((color) => (
                  <button
                    key={color}
                    onClick={() => patch({ accentColor: color })}
                    title={color}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: color,
                      border: settings.accentColor === color ? '2px solid var(--txt)' : '2px solid transparent',
                      outline: '1px solid var(--border)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            }
          />
        </div>

        <div className="card">
          <CardHead title="Modules draft" />
          <Row
            label="Elo des joueurs"
            desc="Rang solo/duo des alliés en direct pendant la champ select (via LCU, sans clé API)."
            control={<Switch value={settings.draft.showElo} onChange={(v) => patch({ draft: { showElo: v } })} />}
          />
          <Row
            label="Forme — 5 dernières games"
            desc="Suite de victoires/défaites et winrate récent de chaque allié."
            control={<Switch value={settings.draft.showForm} onChange={(v) => patch({ draft: { showForm: v } })} />}
          />
          <Row
            label="Liens op.gg"
            desc="Ouvre le profil op.gg de chaque allié dans un nouvel onglet."
            control={<Switch value={settings.draft.showOpgg} onChange={(v) => patch({ draft: { showOpgg: v } })} />}
          />
          <Row
            label="Répartition AD / AP"
            desc="Barre de dégâts physiques/magiques par équipe, hybrides comptés 50/50."
            control={<Switch value={settings.draft.damageAnalysis} onChange={(v) => patch({ draft: { damageAnalysis: v } })} />}
          />
          <Row
            label="Analyse CC"
            desc="Secondes de CC dur par champion et CC lock total de l'équipe."
            control={<Switch value={settings.draft.ccAnalysis} onChange={(v) => patch({ draft: { ccAnalysis: v } })} />}
          />
          <Row
            label="Alertes de compo"
            desc="Full AD/AP, manque de CC… avec suggestions de picks pour compenser."
            control={<Switch value={settings.draft.compAlerts} onChange={(v) => patch({ draft: { compAlerts: v } })} />}
          />
        </div>

        <div className="card">
          <CardHead title="Modules live" />
          <Row
            label="Timers de flash"
            desc="Un clic quand l'ennemi flash ▸ compte à rebours 5:00 sur sa ligne."
            control={<Switch value={settings.live.flashTimers} onChange={(v) => patch({ live: { flashTimers: v } })} />}
          />
          <Row
            label="Timers d'ult"
            desc="Cooldown d'ult estimé selon le niveau (rangs 6/11/16) pour chaque ennemi."
            control={<Switch value={settings.live.ultTimers} onChange={(v) => patch({ live: { ultTimers: v } })} />}
          />
          <Row
            label="Timers de camps"
            desc="Carte cliquable : buffs, camps, sentinelles — respawn placé au bon endroit."
            control={<Switch value={settings.live.campTimers} onChange={(v) => patch({ live: { campTimers: v } })} />}
          />
          <Row
            label="Timers d'objectifs"
            desc="Dragon, Baron, Héraut — démarrés automatiquement sur événement du jeu."
            control={<Switch value={settings.live.objectiveTimers} onChange={(v) => patch({ live: { objectiveTimers: v } })} />}
          />
          <Row
            label="Feed d'événements"
            desc="Kills, objectifs, wards et flashs détectés en direct."
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
