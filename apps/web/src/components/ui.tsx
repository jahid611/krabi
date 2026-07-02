import { useState, type CSSProperties, type ReactNode } from 'react';
import { championByKey, formatClock, type DamageType } from '@krabi/shared';
import { championImageUrl } from '../lib/format';
import { useNow } from '../lib/store';

/**
 * Image avec chaîne de fallback : essaie chaque URL dans l'ordre,
 * puis rend `fallback` si aucune ne charge (offline, asset absent…).
 */
export function ImgChain({
  srcs,
  alt = '',
  style,
  fallback = null,
}: {
  srcs: string[];
  alt?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  if (idx >= srcs.length) return <>{fallback}</>;
  return (
    <img
      src={srcs[idx]}
      alt={alt}
      style={style}
      draggable={false}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

/** En-tête de page : kicker uppercase + gros titre, façon DPM. */
export function PageHead({
  kicker,
  title,
  subtitle,
  right,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
        padding: '40px 0 26px',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--acc-2)',
            marginBottom: 10,
          }}
        >
          {kicker}
        </div>
        <h1
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 'clamp(26px, 3.4vw, 38px)',
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
            color: 'var(--txt)',
          }}
        >
          {title}
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 15.5, lineHeight: 1.5, color: 'var(--dim)', maxWidth: 560 }}>
          {subtitle}
        </p>
      </div>
      {right}
    </div>
  );
}

export function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="card-head">
      <span className="card-title">{title}</span>
      {right}
    </div>
  );
}

/** Vignette champion : icône DDragon arrondie, fallback initiales, variante bannie. */
export function ChampTile({
  championKey,
  size = 40,
  banned,
}: {
  championKey: number;
  size?: number;
  banned?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const champ = championByKey(championKey);
  const radius = Math.max(6, Math.round(size * 0.22));

  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    border: '1px solid var(--img-border)',
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: Math.max(9, size * 0.26),
    fontWeight: 700,
    color: 'var(--muted)',
    overflow: 'hidden',
    position: 'relative',
  };

  const content =
    !champ || championKey === 0 ? (
      <span style={{ color: 'var(--faint)' }}>—</span>
    ) : broken ? (
      champ.name.slice(0, 2).toUpperCase()
    ) : (
      <img
        src={championImageUrl(champ.id)}
        alt={champ.name}
        width={size}
        height={size}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: banned ? 'grayscale(1)' : undefined,
          opacity: banned ? 0.5 : 1,
        }}
        onError={() => setBroken(true)}
      />
    );

  return (
    <div style={base}>
      {content}
      {banned && championKey > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '46%',
            left: -2,
            right: -2,
            height: 2,
            background: 'var(--red-solid)',
            borderRadius: 2,
            transform: 'rotate(-20deg)',
          }}
        />
      )}
    </div>
  );
}

export function DamageBadge({ dmg }: { dmg: DamageType }) {
  const cls = dmg === 'AD' ? 'ad' : dmg === 'AP' ? 'ap' : 'hybrid';
  return <span className={`chip ${cls}`}>{dmg === 'HYBRID' ? 'HYB' : dmg}</span>;
}

/** Compte à rebours basé sur expiresAt (epoch serveur) + offset d'horloge. */
export function Countdown({ expiresAt, clockOffset }: { expiresAt: number; clockOffset: number }) {
  const now = useNow();
  const remaining = Math.max(0, expiresAt - (now + clockOffset));
  const done = remaining <= 0;
  return (
    <span className="mono" style={{ color: done ? 'var(--green)' : 'var(--txt)', fontSize: 12, fontWeight: 700 }}>
      {done ? 'UP' : formatClock(remaining / 1000)}
    </span>
  );
}

export function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={`switch${value ? ' on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    />
  );
}

export function EmptyState({ title, lines, action }: { title: string; lines: string[]; action?: ReactNode }) {
  return (
    <div className="card" style={{ alignItems: 'center', textAlign: 'center', padding: '48px 28px 56px', marginBottom: 48 }}>
      <ImgChain
        srcs={['/decor/poro.png']}
        style={{ width: 110, marginBottom: 14, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.45))' }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--acc-2)',
          marginBottom: 16,
        }}
      >
        {title}
      </span>
      {lines.map((line) => (
        <div key={line} style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--dim)' }}>
          {line}
        </div>
      ))}
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  );
}
