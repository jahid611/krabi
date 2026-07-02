import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CAMPS,
  OBJECTIVES,
  FLASH_CD_SEC,
  championByKey,
  formatClock,
  ultCooldownSeconds,
  type LivePlayer,
  type TrackerTimer,
} from '@krabi/shared';
import { useApp, useNow } from '../lib/store';
import { ChampTile, EmptyState, PanelHead, SectionHead } from '../components/ui';

export function LivePage() {
  const { state } = useApp();
  const live = state?.live;
  const settings = state?.settings;

  const timers = useMemo(() => {
    const map = new Map<string, TrackerTimer>();
    for (const t of state?.timers ?? []) map.set(t.refKey, t);
    return map;
  }, [state?.timers]);

  if (!state || !live || !settings) {
    return (
      <>
        <SectionHead num="02" title="Partie en direct" comment="// TIMERS & TRACKING FAÇON OP.GG" />
        <EmptyState
          title="AUCUNE PARTIE DÉTECTÉE"
          lines={[
            'Le flux Live Client Data (127.0.0.1:2999) sera capté automatiquement',
            'dès que tu seras en jeu. Sinon, active le mode démo.',
          ]}
          action={
            <Link to="/settings" className="ext-link" style={{ fontSize: 12, padding: '10px 16px' }}>
              OUVRIR LES SETTINGS ▸ MODE DÉMO
            </Link>
          }
        />
      </>
    );
  }

  const enemies = live.players.filter((p) => p.isEnemy);

  return (
    <>
      <SectionHead
        num="02"
        title="Partie en direct"
        comment={`// SYNC ▸ ${formatClock(live.gameTimeSec)}`}
      />

      <div className="grid-joint" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
        {settings.live.campTimers && (
          <div className="panel cell">
            <PanelHead
              title="JUNGLE_TRACKER"
              live
              right={<span style={{ color: 'var(--faint)' }}>CLIQUE UN CAMP ▸ TIMER DE RESPAWN</span>}
            />
            <MapBoard timers={timers} showObjectives={settings.live.objectiveTimers} />
          </div>
        )}

        <div className="panel cell">
          <PanelHead
            title="ENEMY_TRACKER"
            warn
            right={<span style={{ color: 'var(--faint)' }}>FLASH & ULTS ENNEMIS</span>}
          />
          <div>
            {enemies.map((p) => (
              <EnemyRow key={p.index} player={p} timers={timers} settings={settings} />
            ))}
          </div>

          {settings.live.objectiveTimers && <ObjectiveStrip timers={timers} />}
        </div>

        {settings.live.eventFeed && <EventFeed scanlines={settings.scanlines} />}
      </div>
    </>
  );
}

/* ============ carte de la faille (SVG stylisé) ============ */

function MapBoard({ timers, showObjectives }: { timers: Map<string, TrackerTimer>; showObjectives: boolean }) {
  const { startTimer, cancelTimer, clockOffset } = useApp();
  const now = useNow();

  const toggle = (kind: 'CAMP' | 'OBJECTIVE', refKey: string, label: string, durationSec: number) => {
    if (timers.has(refKey)) cancelTimer(refKey);
    else startTimer(kind, refKey, label, durationSec * 1000);
  };

  const remaining = (refKey: string): number | null => {
    const t = timers.get(refKey);
    if (!t) return null;
    return Math.max(0, t.expiresAt - (now + clockOffset)) / 1000;
  };

  return (
    <div style={{ padding: 14 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', display: 'block', border: '1px solid var(--line)', background: '#030303' }}>
        {/* rivière (anti-diagonale) et voies */}
        <polygon points="0,0 12,0 100,88 100,100 88,100 0,12" fill="#0a1410" opacity="0.9" />
        <polygon points="0,100 8,92 100,0 92,0 0,92" fill="#101010" />
        <rect x="0" y="0" width="7" height="100" fill="#0d0d0d" />
        <rect x="0" y="0" width="100" height="7" fill="#0d0d0d" />
        <rect x="93" y="0" width="7" height="100" fill="#0d0d0d" />
        <rect x="0" y="93" width="100" height="7" fill="#0d0d0d" />
        {/* bases */}
        <rect x="1" y="85" width="14" height="14" fill="none" stroke="#1d3a2a" strokeWidth="0.6" />
        <rect x="85" y="1" width="14" height="14" fill="none" stroke="#3a241d" strokeWidth="0.6" />

        {CAMPS.map((camp) => {
          const refKey = `camp:${camp.id}`;
          const rem = remaining(refKey);
          const cx = camp.x * 100;
          const cy = (1 - camp.y) * 100;
          const color = camp.side === 'BLUE' ? '#3f7fbf' : camp.side === 'RED' ? '#bf5a3f' : '#3fbf8f';
          return (
            <g key={camp.id} onClick={() => toggle('CAMP', refKey, camp.label, camp.respawnSec)} style={{ cursor: 'pointer' }}>
              <title>{`${camp.label} — respawn ${formatClock(camp.respawnSec)}`}</title>
              <circle cx={cx} cy={cy} r={3.4} fill="#050505" stroke={rem !== null ? 'var(--acc)' : color} strokeWidth={rem !== null ? 0.9 : 0.6} />
              <text x={cx} y={cy + 1.1} textAnchor="middle" fontSize="2.8" fontFamily="var(--mono)" fill={rem !== null ? 'var(--acc)' : '#9a9a9a'}>
                {camp.short}
              </text>
              {rem !== null && (
                <text x={cx} y={cy + 6.4} textAnchor="middle" fontSize="3" fontFamily="var(--mono)" fill="var(--acc)" fontWeight="700">
                  {formatClock(rem)}
                </text>
              )}
            </g>
          );
        })}

        {showObjectives &&
          OBJECTIVES.filter((o) => o.id !== 'herald').map((obj) => {
            const refKey = `obj:${obj.id}`;
            const rem = remaining(refKey);
            const cx = obj.x * 100;
            const cy = (1 - obj.y) * 100;
            return (
              <g key={obj.id} onClick={() => toggle('OBJECTIVE', refKey, obj.short, obj.respawnSec)} style={{ cursor: 'pointer' }}>
                <title>{`${obj.label} — respawn ${formatClock(obj.respawnSec)}`}</title>
                <rect
                  x={cx - 3}
                  y={cy - 3}
                  width="6"
                  height="6"
                  transform={`rotate(45 ${cx} ${cy})`}
                  fill="#050505"
                  stroke={rem !== null ? 'var(--warn)' : '#e6e6e6'}
                  strokeWidth="0.7"
                />
                <text x={cx} y={cy - 5} textAnchor="middle" fontSize="2.6" fontFamily="var(--mono)" fill="#e6e6e6">
                  {obj.short}
                </text>
                {rem !== null && (
                  <text x={cx} y={cy + 7.6} textAnchor="middle" fontSize="3.2" fontFamily="var(--mono)" fill="var(--warn)" fontWeight="700">
                    {formatClock(rem)}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', marginTop: 8, letterSpacing: '0.04em' }}>
        BUFFS 5:00 · CAMPS 2:15 · SENTINELLES 2:30 · <span className="ok">CLIC ▸ START</span> ·{' '}
        <span className="crit">RE-CLIC ▸ RESET</span>
      </div>
    </div>
  );
}

/* ============ trackers ennemis (flash + R) ============ */

function EnemyRow({
  player,
  timers,
  settings,
}: {
  player: LivePlayer;
  timers: Map<string, TrackerTimer>;
  settings: NonNullable<ReturnType<typeof useApp>['state']>['settings'];
}) {
  const champ = championByKey(player.championId);

  return (
    <div className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px' }}>
      <ChampTile championKey={player.championId} size={34} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>{champ?.name ?? '—'}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--dim-2)' }}>
          NIV {player.level} · {player.kills}/{player.deaths}/{player.assists}
          {player.isDead && <span className="crit"> · MORT {player.respawnIn}s</span>}
        </div>
      </div>

      {settings.live.flashTimers && (
        <TrackerButton
          refKey={`flash:${player.index}`}
          label="FLASH"
          kind="FLASH"
          durationSec={FLASH_CD_SEC}
          timers={timers}
          activeClass="warn-active"
        />
      )}
      {settings.live.ultTimers && (
        <UltButton player={player} timers={timers} />
      )}
    </div>
  );
}

function UltButton({ player, timers }: { player: LivePlayer; timers: Map<string, TrackerTimer> }) {
  const cd = ultCooldownSeconds(player.championId, player.level);
  if (cd === null) {
    return (
      <button className="btn" disabled style={{ opacity: 0.35, cursor: 'default' }}>
        R — NIV 6
      </button>
    );
  }
  return (
    <TrackerButton
      refKey={`ult:${player.index}`}
      label={`R ${formatClock(cd)}`}
      shortLabel="R"
      kind="ULT"
      durationSec={cd}
      timers={timers}
      activeClass="active"
    />
  );
}

function TrackerButton({
  refKey,
  label,
  shortLabel,
  kind,
  durationSec,
  timers,
  activeClass,
}: {
  refKey: string;
  label: string;
  shortLabel?: string;
  kind: 'FLASH' | 'ULT';
  durationSec: number;
  timers: Map<string, TrackerTimer>;
  activeClass: string;
}) {
  const { startTimer, cancelTimer, clockOffset } = useApp();
  const now = useNow();
  const timer = timers.get(refKey);
  const remaining = timer ? Math.max(0, timer.expiresAt - (now + clockOffset)) / 1000 : null;

  if (remaining !== null) {
    return (
      <button className={`btn ${activeClass}`} onClick={() => cancelTimer(refKey)} title="Re-clic pour annuler">
        {shortLabel ?? label.split(' ')[0]} ▸ {formatClock(remaining)}
      </button>
    );
  }
  return (
    <button className="btn" onClick={() => startTimer(kind, refKey, shortLabel ?? label, durationSec * 1000)} title={`Démarre ${formatClock(durationSec)}`}>
      {label}
    </button>
  );
}

/* ============ objectifs (bandeau sous les trackers) ============ */

function ObjectiveStrip({ timers }: { timers: Map<string, TrackerTimer> }) {
  const { startTimer, cancelTimer, clockOffset } = useApp();
  const now = useNow();

  return (
    <div style={{ borderTop: '1px solid var(--line)', background: 'var(--panel)', padding: '10px 14px', marginTop: 'auto' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', letterSpacing: '0.08em', marginBottom: 8 }}>
        // OBJECTIFS — AUTO SUR ÉVÉNEMENT, CLIC EN SECOURS
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OBJECTIVES.map((obj) => {
          const refKey = `obj:${obj.id}`;
          const timer = timers.get(refKey);
          const remaining = timer ? Math.max(0, timer.expiresAt - (now + clockOffset)) / 1000 : null;
          if (remaining !== null) {
            return (
              <button key={obj.id} className="btn warn-active" onClick={() => cancelTimer(refKey)}>
                {obj.short} ▸ {formatClock(remaining)}
                {timer?.auto && <span style={{ marginLeft: 6, opacity: 0.7 }}>AUTO</span>}
              </button>
            );
          }
          return (
            <button
              key={obj.id}
              className="btn"
              onClick={() => startTimer('OBJECTIVE', refKey, obj.short, obj.respawnSec * 1000)}
            >
              {obj.short} {formatClock(obj.respawnSec)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ feed d'événements (terminal) ============ */

const TAG_COLORS: Record<string, string> = {
  KILL: 'var(--acc)',
  DEATH: 'var(--warn)',
  OBJ: '#ffffff',
  WARD: '#7a7a7a',
  FLASH: '#e8ff3a',
  ULT: '#00e5ff',
  CAMP: '#3fbf8f',
  TOUR: '#cfcfcf',
  INHIB: 'var(--warn)',
  START: 'var(--acc)',
};

function EventFeed({ scanlines }: { scanlines: boolean }) {
  const { state } = useApp();
  const events = state?.live?.events ?? [];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <div className="panel cell" style={{ minHeight: 260 }}>
      <PanelHead
        title="EVENT_FEED"
        live
        right={<span className="ok">● LIVE</span>}
      />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex' }}>
        <div className="term" ref={ref} style={{ flex: 1, maxHeight: 420 }}>
          <div style={{ color: 'var(--faint)' }}>
            <span className="ok">[OK]</span> écoute liveclientdata @ 127.0.0.1:2999
          </div>
          <div style={{ color: '#2a2a2a', padding: '4px 0' }}>──────────────────────────────</div>
          {events.map((ev) => (
            <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#555' }}>[{formatClock(ev.timeSec)}]</span>
              <span style={{ color: TAG_COLORS[ev.tag] ?? '#cfcfcf', fontWeight: 700, width: 52, flex: 'none' }}>
                {ev.tag}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{ev.detail}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--acc)', paddingTop: 6 }}>
            <span>›</span>
            <span style={{ width: 8, height: 15, background: 'var(--acc)', display: 'inline-block', animation: 'caret 1s steps(1) infinite' }} />
          </div>
        </div>
        {scanlines && <div className="scan-line" />}
      </div>
    </div>
  );
}
