import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { DraftPage } from './pages/DraftPage';
import { LivePage } from './pages/LivePage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <div className="shell">
          <Routes>
            <Route path="/" element={<DraftPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="shell"
          style={{
            padding: '20px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12.5,
            color: 'var(--muted)',
          }}
        >
          <span style={{ fontWeight: 600 }}>© 2026 KRABI.GG — Tes données restent sur ton PC.</span>
          <span style={{ color: 'var(--faint)' }}>
            Non affilié à Riot Games. League of Legends est une marque de Riot Games, Inc.
          </span>
        </div>
      </footer>
    </div>
  );
}
