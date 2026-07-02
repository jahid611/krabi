import type { AppSettings, DeepPartial } from '@krabi/shared';
import { useApp } from '../lib/store';
import { SectionHead, Toggle } from '../components/ui';

const ACCENTS = ['#41FF83', '#FF6A1A', '#00E5FF', '#E8FF3A'];

export function SettingsPage() {
  const { state, patchSettings } = useApp();
  const settings = state?.settings;

  if (!settings) {
    return (
      <div className="mono" style={{ padding: 28, fontSize: 12, color: 'var(--faint)' }}>
        // CHARGEMENT DES SETTINGS…
      </div>
    );
  }

  const patch = (p: DeepPartial<AppSettings>) => patchSettings(p);

  return (
    <>
      <SectionHead num="03" title="Settings" comment="// TOUT EST DÉBRAYABLE, MODULE PAR MODULE" />

      <Group num="01" title="Général">
        <Row
          label="MODE DÉMO"
          desc="Simule une champ select puis une partie complète en boucle — pour tester l'app sans client League."
          control={<Toggle value={settings.demoMode} onChange={(v) => patch({ demoMode: v })} />}
        />
        <Row
          label="COULEUR D'ACCENT"
          desc="Teinte néon de l'interface."
          control={
            <div style={{ display: 'flex', gap: 8 }}>
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  onClick={() => patch({ accentColor: color })}
                  title={color}
                  style={{
                    width: 22,
                    height: 22,
                    background: color,
                    border: settings.accentColor === color ? '2px solid #fff' : '1px solid var(--line)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          }
        />
        <Row
          label="SCANLINES"
          desc="Balayage lumineux sur les panneaux type terminal."
          control={<Toggle value={settings.scanlines} onChange={(v) => patch({ scanlines: v })} />}
        />
      </Group>

      <Group num="02" title="Modules Draft">
        <Row
          label="ELO DES JOUEURS"
          desc="Rang solo/duo des alliés en direct pendant la champ select (via LCU, sans clé API)."
          control={<Toggle value={settings.draft.showElo} onChange={(v) => patch({ draft: { showElo: v } })} />}
        />
        <Row
          label="FORME — 5 DERNIÈRES GAMES"
          desc="Suite de victoires/défaites et winrate récent de chaque allié."
          control={<Toggle value={settings.draft.showForm} onChange={(v) => patch({ draft: { showForm: v } })} />}
        />
        <Row
          label="LIENS OP.GG"
          desc="Ouvre le profil op.gg de chaque allié dans un nouvel onglet."
          control={<Toggle value={settings.draft.showOpgg} onChange={(v) => patch({ draft: { showOpgg: v } })} />}
        />
        <Row
          label="RÉPARTITION AD / AP"
          desc="Barre de dégâts physiques/magiques de chaque équipe, hybrides comptés 50/50."
          control={<Toggle value={settings.draft.damageAnalysis} onChange={(v) => patch({ draft: { damageAnalysis: v } })} />}
        />
        <Row
          label="ANALYSE CC"
          desc="Secondes de CC dur par champion et CC lock total de l'équipe."
          control={<Toggle value={settings.draft.ccAnalysis} onChange={(v) => patch({ draft: { ccAnalysis: v } })} />}
        />
        <Row
          label="ALERTES DE COMPO"
          desc="Full AD/AP, manque de CC… avec suggestions de picks pour compenser."
          control={<Toggle value={settings.draft.compAlerts} onChange={(v) => patch({ draft: { compAlerts: v } })} />}
        />
      </Group>

      <Group num="03" title="Modules Live">
        <Row
          label="TIMERS DE FLASH"
          desc="Un clic quand l'ennemi flash ▸ compte à rebours 5:00 sur sa ligne."
          control={<Toggle value={settings.live.flashTimers} onChange={(v) => patch({ live: { flashTimers: v } })} />}
        />
        <Row
          label="TIMERS D'ULT"
          desc="Cooldown d'ult estimé selon le niveau (rangs 6/11/16) pour chaque ennemi."
          control={<Toggle value={settings.live.ultTimers} onChange={(v) => patch({ live: { ultTimers: v } })} />}
        />
        <Row
          label="TIMERS DE CAMPS"
          desc="Carte cliquable : buffs, camps, sentinelles — respawn placé au bon endroit."
          control={<Toggle value={settings.live.campTimers} onChange={(v) => patch({ live: { campTimers: v } })} />}
        />
        <Row
          label="TIMERS D'OBJECTIFS"
          desc="Dragon, Baron, Héraut — démarrés automatiquement sur événement du jeu."
          control={<Toggle value={settings.live.objectiveTimers} onChange={(v) => patch({ live: { objectiveTimers: v } })} />}
        />
        <Row
          label="FEED D'ÉVÉNEMENTS"
          desc="Terminal des kills, objectifs, wards et flashs détectés en direct."
          control={<Toggle value={settings.live.eventFeed} onChange={(v) => patch({ live: { eventFeed: v } })} />}
        />
      </Group>
    </>
  );
}

function Group({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderBottom: '1px solid var(--line)' }}>
      <div
        style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '16px 24px 10px' }}
      >
        <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--acc)', lineHeight: 1 }}>
          {num}
        </span>
        <span className="mono" style={{ fontSize: 14, color: 'var(--line)' }}>/</span>
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({ label, desc, control }: { label: string; desc: string; control: React.ReactNode }) {
  return (
    <div
      className="row-line"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 18,
        padding: '13px 24px',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--txt-2)' }}>
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
      </div>
      {control}
    </div>
  );
}
