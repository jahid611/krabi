import { NavLink } from 'react-router-dom';
import { useApp } from '../lib/store';
import { formatClock } from '@krabi/shared';
import { LiveChip } from './ui';

const PHASE_LABEL: Record<string, string> = {
  IDLE: 'Inactif',
  LOBBY: 'Lobby',
  CHAMPSELECT: 'Champ select',
  INGAME: 'En jeu',
  POSTGAME: 'Fin de partie',
};

export function Header() {
  const { state, connected } = useApp();
  const status = state?.status;

  return (
    <nav className="nav">
      <div
        className="shell"
        style={{
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'linear-gradient(135deg, var(--acc) 0%, #e5459b 120%)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 3px 10px color-mix(in srgb, var(--acc) 35%, transparent)',
              flex: 'none',
            }}
          >
            K
          </span>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>Krabi</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>/companion</span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Draft
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Live
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Settings
          </NavLink>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 'none' }}>
          <LiveChip on={connected} label="CONNECTÉ" offLabel="SERVEUR OFF" />
        </div>
      </div>

      {/* bandeau d'état des connecteurs */}
      <div style={{ borderTop: '1px solid var(--border-soft)' }}>
        <div
          className="shell"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px 26px',
            padding: '9px 32px',
          }}
        >
          <Strip label="LCU" value={status?.lcu ? 'Connecté' : 'Offline'} ok={status?.lcu} />
          <Strip
            label="Phase"
            value={PHASE_LABEL[status?.gameflow ?? 'IDLE']}
            ok={status?.gameflow === 'CHAMPSELECT' || status?.gameflow === 'INGAME'}
          />
          <Strip label="Live data" value={status?.liveData ? 'Flux actif' : '—'} ok={status?.liveData} />
          <Strip label="Mode" value={status?.demo ? 'Démo' : 'Réel'} ok={!status?.demo} />
          {state?.live && (
            <span className="chip mono" style={{ marginLeft: 'auto' }}>
              SYNC ▸ {formatClock(state.live.gameTimeSec)}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

function Strip({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span className="kicker">{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: ok ? 'var(--green)' : 'var(--muted)' }}>{value}</span>
    </span>
  );
}
