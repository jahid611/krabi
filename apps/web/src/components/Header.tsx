import { NavLink } from 'react-router-dom';
import { useApp } from '../lib/store';
import { formatClock } from '@krabi/shared';

export function Header() {
  const { state } = useApp();
  const status = state?.status;

  const pill = (() => {
    if (status?.demo) return { cls: 'demo', label: 'Mode démo' };
    if (status?.gameflow === 'INGAME') return { cls: 'on', label: 'En jeu' };
    if (status?.gameflow === 'CHAMPSELECT') return { cls: 'on', label: 'Champ select' };
    if (status?.lcu) return { cls: 'on', label: 'Client détecté' };
    return { cls: '', label: 'En attente du client' };
  })();

  return (
    <nav className="nav">
      <div
        className="shell"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--acc)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              flex: 'none',
            }}
          >
            K
          </span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Krabi</span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Draft
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            En direct
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Réglages
          </NavLink>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          {state?.live && (
            <span className="chip mono" style={{ fontSize: 12, padding: '6px 11px' }}>
              {formatClock(state.live.gameTimeSec)}
            </span>
          )}
          <span className={`status-pill ${pill.cls}`}>
            <span className="dot" />
            {pill.label}
          </span>
        </div>
      </div>
    </nav>
  );
}
