import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { DraftPage } from './pages/DraftPage';
import { LivePage } from './pages/LivePage';
import { SettingsPage } from './pages/SettingsPage';
import { useApp } from './lib/store';

export function App() {
  const { state } = useApp();

  // couleur d'accent pilotée par les settings (voir page Settings)
  useEffect(() => {
    document.documentElement.style.setProperty('--acc', state?.settings.accentColor ?? '#41FF83');
  }, [state?.settings.accentColor]);

  return (
    <div className="frame">
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<DraftPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <footer
        style={{
          borderTop: '1px solid var(--line)',
          padding: '16px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
        }}
        className="mono"
      >
        <span style={{ fontSize: 11, letterSpacing: '0.04em', color: 'var(--faint)' }}>
          <span className="ok">ZÉRO TRACKING</span> · <span className="ok">ZÉRO CLOUD</span> ·{' '}
          <span style={{ color: 'var(--txt-2)' }}>100% LOCAL</span>
        </span>
        <span style={{ fontSize: 11, color: 'var(--ghost)' }}>
          Non affilié à Riot Games · League of Legends est une marque de Riot Games, Inc. · Build 1.0.0
        </span>
      </footer>
    </div>
  );
}
