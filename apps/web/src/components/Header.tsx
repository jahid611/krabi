import { NavLink } from 'react-router-dom';
import { useApp } from '../lib/store';
import { formatClock } from '@krabi/shared';

const PHASE_LABEL: Record<string, string> = {
  IDLE: 'INACTIF',
  LOBBY: 'LOBBY',
  CHAMPSELECT: 'CHAMP SELECT',
  INGAME: 'EN JEU',
  POSTGAME: 'FIN DE PARTIE',
};

export function Header() {
  const { state, connected } = useApp();
  const status = state?.status;

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: '1px solid var(--line)',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 15, height: 15, background: 'var(--acc)' }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>KRABI</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--dim-2)' }}>/companion</span>
        </div>

        <nav style={{ display: 'flex', gap: 6 }}>
          <NavLink to="/" end className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
            Draft
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
            Live
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
            Settings
          </NavLink>
        </nav>

        <div
          className="mono"
          style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11, letterSpacing: '0.04em', color: 'var(--dim-2)' }}
        >
          <span className={`dot ${connected ? '' : 'off'}`} />
          <span>{connected ? 'CONNECTÉ AU SERVEUR' : 'SERVEUR INJOIGNABLE'}</span>
        </div>
      </header>

      {/* bandeau technique : état des connecteurs */}
      <div
        className="grid-joint"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
      >
        <Strip label="LCU" value={status?.lcu ? 'CONNECTÉ' : 'OFFLINE'} ok={status?.lcu} />
        <Strip
          label="PHASE"
          value={PHASE_LABEL[status?.gameflow ?? 'IDLE']}
          ok={status?.gameflow === 'CHAMPSELECT' || status?.gameflow === 'INGAME'}
        />
        <Strip label="LIVE DATA" value={status?.liveData ? 'FLUX ACTIF' : '--'} ok={status?.liveData} />
        <Strip
          label="MODE"
          value={status?.demo ? 'DÉMO' : 'RÉEL'}
          ok={!status?.demo}
          extra={
            state?.live
              ? `SYNC ▸ ${formatClock(state.live.gameTimeSec)}`
              : undefined
          }
        />
      </div>
    </>
  );
}

function Strip({ label, value, ok, extra }: { label: string; value: string; ok?: boolean; extra?: string }) {
  return (
    <div
      className="cell mono"
      style={{ padding: '10px 16px', fontSize: 11, display: 'flex', gap: 8, letterSpacing: '0.03em' }}
    >
      <span style={{ color: 'var(--faint)' }}>{label}</span>
      <span style={{ color: ok ? 'var(--acc)' : 'var(--txt-2)' }}>{value}</span>
      {extra && <span style={{ color: 'var(--dim-2)', marginLeft: 'auto' }}>{extra}</span>}
    </div>
  );
}
