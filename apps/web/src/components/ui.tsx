import { useState, type ReactNode } from 'react';
import { championByKey, formatClock, type DamageType } from '@krabi/shared';
import { championImageUrl } from '../lib/format';
import { useNow } from '../lib/store';

export function SectionHead({ num, title, comment }: { num: string; title: string; comment?: string }) {
  return (
    <div className="section-head">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span className="num">{num}</span>
        <h2>{title}</h2>
      </div>
      {comment && <span className="comment">{comment}</span>}
    </div>
  );
}

export function PanelHead({
  title,
  live,
  right,
  warn,
}: {
  title: string;
  live?: boolean;
  warn?: boolean;
  right?: ReactNode;
}) {
  return (
    <div className="panel-head">
      <div className="panel-title">
        <span className={`dot ${warn ? 'warn' : live ? '' : 'off'}`} />
        {title}
      </div>
      {right}
    </div>
  );
}

/** Vignette champion : icône DDragon, fallback initiales si offline. */
export function ChampTile({ championKey, size = 34, dimmed }: { championKey: number; size?: number; dimmed?: boolean }) {
  const [broken, setBroken] = useState(false);
  const champ = championByKey(championKey);

  const base: React.CSSProperties = {
    width: size,
    height: size,
    border: '1px solid var(--line)',
    flex: 'none',
    opacity: dimmed ? 0.45 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    fontFamily: 'var(--mono)',
    fontSize: Math.max(9, size * 0.28),
    color: 'var(--dim-2)',
    overflow: 'hidden',
  };

  if (!champ || championKey === 0) {
    return <div style={base}>—</div>;
  }

  if (broken) {
    return <div style={base}>{champ.name.slice(0, 3).toUpperCase()}</div>;
  }

  return (
    <div style={base}>
      <img
        src={championImageUrl(champ.id)}
        alt={champ.name}
        width={size}
        height={size}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setBroken(true)}
      />
    </div>
  );
}

export function DamageBadge({ dmg }: { dmg: DamageType }) {
  const cls = dmg === 'AD' ? 'ad' : dmg === 'AP' ? 'ap' : 'hybrid';
  return <span className={`badge ${cls}`}>{dmg === 'HYBRID' ? 'HYB' : dmg}</span>;
}

/** Compte à rebours basé sur expiresAt (epoch serveur) + offset d'horloge. */
export function Countdown({ expiresAt, clockOffset }: { expiresAt: number; clockOffset: number }) {
  const now = useNow();
  const remaining = Math.max(0, expiresAt - (now + clockOffset));
  const done = remaining <= 0;
  return (
    <span className="mono" style={{ color: done ? 'var(--acc)' : 'var(--txt-2)', fontSize: 12 }}>
      {done ? 'UP' : formatClock(remaining / 1000)}
    </span>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={`toggle ${value ? 'on' : 'off'}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="on-label">ON</span>
      <span className="off-label">OFF</span>
    </div>
  );
}

export function EmptyState({ title, lines, action }: { title: string; lines: string[]; action?: ReactNode }) {
  return (
    <div style={{ padding: '56px 28px', textAlign: 'center' }}>
      <div
        className="mono"
        style={{ fontSize: 12, color: 'var(--faint)', letterSpacing: '0.08em', marginBottom: 18 }}
      >
        // {title}
      </div>
      {lines.map((line) => (
        <div key={line} className="dim" style={{ fontSize: 14, lineHeight: 1.7 }}>
          {line}
        </div>
      ))}
      {action && <div style={{ marginTop: 22 }}>{action}</div>}
    </div>
  );
}
