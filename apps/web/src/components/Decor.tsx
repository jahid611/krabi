import type { CSSProperties } from 'react';

/**
 * Illustrations flottantes de l'univers du jeu, placées dans les gouttières
 * de la page (façon mascottes dpm.lol). Les fichiers vivent dans
 * `apps/web/public/decor/` — une image absente est simplement masquée.
 */
interface DecorItem {
  src: string;
  style: CSSProperties;
}

const DECOR: Record<'draft' | 'live' | 'settings', DecorItem[]> = {
  draft: [
    { src: '/decor/poro.png', style: { left: '1.5vw', bottom: 90, width: 140, transform: 'rotate(-6deg)' } },
    { src: '/decor/sword.png', style: { right: '2vw', top: 130, width: 84, transform: 'rotate(12deg)' } },
  ],
  live: [
    { src: '/decor/ekko.png', style: { right: '0.8vw', bottom: 60, width: 170 } },
    { src: '/decor/ez.png', style: { left: '1.8vw', top: 150, width: 110, transform: 'rotate(-9deg)' } },
  ],
  settings: [
    { src: '/decor/ekko-arcane.png', style: { right: '1vw', top: 120, width: 190 } },
    { src: '/decor/poro.png', style: { left: '1.5vw', bottom: 80, width: 120, transform: 'rotate(5deg)' } },
  ],
};

export function FloatingDecor({ page }: { page: keyof typeof DECOR }) {
  return (
    <>
      {DECOR[page].map((item, i) => (
        <span key={`${item.src}-${i}`} className="decor" style={item.style}>
          <img
            src={item.src}
            alt=""
            draggable={false}
            style={{ width: '100%', display: 'block', animationDelay: `${i * 1.4}s` }}
            onError={(e) => {
              const wrap = e.currentTarget.parentElement;
              if (wrap) wrap.style.display = 'none';
            }}
          />
        </span>
      ))}
    </>
  );
}
