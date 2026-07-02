import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { DraftPage } from './pages/DraftPage';
import { LivePage } from './pages/LivePage';
import { SettingsPage } from './pages/SettingsPage';
import { useApp } from './lib/store';

export function App() {
  const { state } = useApp();

  // thème (sombre/clair) + couleur d'accent pilotés par les settings
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state?.settings.theme ?? 'dark';
    root.style.setProperty('--acc', state?.settings.accentColor ?? '#6a5cff');
  }, [state?.settings.theme, state?.settings.accentColor]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, background: 'var(--bg-alt)' }}>
        <div className="shell">
          <Routes>
            <Route path="/" element={<DraftPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div
          className="shell"
          style={{
            padding: '22px 32px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12.5,
            color: 'var(--muted)',
          }}
        >
          <span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>Zéro tracking</span> ·{' '}
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>zéro cloud</span> ·{' '}
            <span style={{ color: 'var(--txt-2)', fontWeight: 600 }}>100% local</span>
          </span>
          <span style={{ color: 'var(--faint)' }}>
            Non affilié à Riot Games. League of Legends est une marque de Riot Games, Inc. · Build 1.0.0
          </span>
        </div>
      </footer>
    </div>
  );
}
