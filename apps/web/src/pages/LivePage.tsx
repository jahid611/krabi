import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CAMPS,
  OBJECTIVES,
  FLASH_CD_SEC,
  championByKey,
  formatClock,
  ultCooldownSeconds,
  type AppSettings,
  type LiveEvent,
  type LivePlayer,
  type TrackerTimer,
} from '@krabi/shared';
import { useApp, useNow } from '../lib/store';
import { CardHead, ChampTile, EmptyState, LiveChip, PageHead } from '../components/ui';

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
        <PageHead
          title="Ta partie, chronométrée."
          subtitle="Flash et ults ennemis, camps de jungle et objectifs — les timers au bon endroit, façon op.gg."
        />
        <EmptyState
          title="// AUCUNE PARTIE DÉTECTÉE"
          lines={[
            'Le flux Live Client Data (127.0.0.1:2999) sera capté automatiquement dès que tu seras en jeu.',
            'Sinon, active le mode démo.',
          ]}
          action={
            <Link to="/settings" className="btn-primary">
              Ouvrir les settings › mode démo
            </Link>
          }
        />
      </>
    );
  }

  const enemies = live.players.filter((p) => p.isEnemy);

  return (
    <>
      <PageHead
        title="Ta partie, chronométrée."
        subtitle="Flash et ults ennemis, camps de jungle et objectifs — les timers au bon endroit, façon op.gg."
        right={
          <span className="chip mono" style={{ fontSize: 13, padding: '6px 12px', fontWeight: 700, marginBottom: 6 }}>
            ⏱ {formatClock(live.gameTimeSec)}
          </span>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
          paddingBottom: 56,
        }}
      >
        {settings.live.campTimers && (
          <div className="card">
            <CardHead title="Jungle tracker" right={<span className="kicker" style={{ fontSize: 9.5 }}>Clique un camp ▸ timer</span>} />
            <MapBoard timers={timers} showObjectives={settings.live.objectiveTimers} />
          </div>
        )}

        <div className="card">
          <CardHead title="Trackers ennemis" right={<span className="kicker" style={{ fontSize: 9.5 }}>Flash & ults</span>} />
          <div>
            {enemies.map((p) => (
              <EnemyRow key={p.index} player={p} timers={timers} settings={settings} />
            ))}
          </div>
          {settings.live.objectiveTimers && <ObjectiveInset timers={timers} />}
        </div>

        {settings.live.eventFeed && <EventFeed events={live.events} />}
      </div>
    </>
  );
}

/* ============ carte de la faille (SVG stylisé) ============ */

const CAMP_COLORS: Record<string, string> = {
  BLUE: '#5b8def',
  RED: '#e8734d',
  RIVER: 'var(--green)',
};

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
    <div style={{ padding: 18 }}>
      <svg
        viewBox="0 0 100 100"
        style={{ width: '100%', display: 'block', borderRadius: 14, background: 'var(--inset)', border: '1px solid var(--border-soft)' }}
      >
        {/* rivière (anti-diagonale) et voies */}
        <polygon points="0,0 12,0 100,88 100,100 88,100 0,12" fill="var(--acc)" opacity="0.07" />
        <polygon points="0,100 8,92 100,0 92,0 0,92" fill="var(--neutral-chip)" opacity="0.10" />
        <rect x="0" y="0" width="7" height="100" fill="var(--neutral-chip)" opacity="0.08" />
        <rect x="0" y="0" width="100" height="7" fill="var(--neutral-chip)" opacity="0.08" />
        <rect x="93" y="0" width="7" height="100" fill="var(--neutral-chip)" opacity="0.08" />
        <rect x="0" y="93" width="100" height="7" fill="var(--neutral-chip)" opacity="0.08" />
        {/* bases */}
        <rect x="1.5" y="85.5" width="13" height="13" rx="3" fill="none" stroke="#5b8def" strokeOpacity="0.5" strokeWidth="0.6" />
        <rect x="85.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="#e8734d" strokeOpacity="0.5" strokeWidth="0.6" />

        {CAMPS.map((camp) => {
          const refKey = `camp:${camp.id}`;
          const rem = remaining(refKey);
          const cx = camp.x * 100;
          const cy = (1 - camp.y) * 100;
          const color = CAMP_COLORS[camp.side];
          return (
            <g key={camp.id} onClick={() => toggle('CAMP', refKey, camp.label, camp.respawnSec)} style={{ cursor: 'pointer' }}>
              <title>{`${camp.label} — respawn ${formatClock(camp.respawnSec)}`}</title>
              <circle
                cx={cx}
                cy={cy}
                r={3.6}
                fill="var(--card)"
                stroke={rem !== null ? 'var(--acc)' : color}
                strokeWidth={rem !== null ? 1.1 : 0.7}
              />
              <text x={cx} y={cy + 1.1} textAnchor="middle" fontSize="2.8" fontWeight="700" fontFamily="'JetBrains Mono', monospace" fill={rem !== null ? 'var(--acc-text)' : 'var(--muted)'}>
                {camp.short}
              </text>
              {rem !== null && (
                <text x={cx} y={cy + 6.8} textAnchor="middle" fontSize="3" fontWeight="700" fontFamily="'JetBrains Mono', monospace" fill="var(--acc-text)">
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
                  rx="1.4"
                  transform={`rotate(45 ${cx} ${cy})`}
                  fill={rem !== null ? 'var(--orange-bg)' : 'var(--card)'}
                  stroke="var(--orange-bar)"
                  strokeWidth="0.8"
                />
                <text x={cx} y={cy - 5.2} textAnchor="middle" fontSize="2.6" fontWeight="700" fontFamily="'JetBrains Mono', monospace" fill="var(--orange)">
                  {obj.short}
                </text>
                {rem !== null && (
                  <text x={cx} y={cy + 8} textAnchor="middle" fontSize="3.2" fontWeight="700" fontFamily="'JetBrains Mono', monospace" fill="var(--orange)">
                    {formatClock(rem)}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        <span className="chip mono">Buffs 5:00</span>
        <span className="chip mono">Camps 2:15</span>
        <span className="chip mono">Sentinelles 2:30</span>
        <span className="chip ok">Clic ▸ start</span>
        <span className="chip danger">Re-clic ▸ reset</span>
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
  settings: AppSettings;
}) {
  const champ = championByKey(player.championId);

  return (
    <div className="player-row">
      <ChampTile championKey={player.championId} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>{champ?.name ?? '—'}</div>
        <div
          className="mono"
          style={{ fontSize: 10, color: 'var(--faint)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          NIV {player.level} · {player.kills}/{player.deaths}/{player.assists}
          {player.isDead && <span style={{ color: 'var(--red)', fontWeight: 700 }}> · mort {player.respawnIn}s</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7, flex: 'none' }}>
        {settings.live.flashTimers && (
          <TrackerButton
            refKey={`flash:${player.index}`}
            idleLabel="Flash"
            activeLabel="Flash"
            kind="FLASH"
            durationSec={FLASH_CD_SEC}
            timers={timers}
            activeClass="is-warn"
          />
        )}
        {settings.live.ultTimers && <UltButton player={player} timers={timers} />}
      </div>
    </div>
  );
}

function UltButton({ player, timers }: { player: LivePlayer; timers: Map<string, TrackerTimer> }) {
  const cd = ultCooldownSeconds(player.championId, player.level);
  if (cd === null) {
    return (
      <button className="btn-ghost" disabled>
        R · niv 6
      </button>
    );
  }
  return (
    <TrackerButton
      refKey={`ult:${player.index}`}
      idleLabel={`R ${formatClock(cd)}`}
      activeLabel="R"
      kind="ULT"
      durationSec={cd}
      timers={timers}
      activeClass="is-ap"
    />
  );
}

function TrackerButton({
  refKey,
  idleLabel,
  activeLabel,
  kind,
  durationSec,
  timers,
  activeClass,
}: {
  refKey: string;
  idleLabel: string;
  activeLabel: string;
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
      <button className={`btn-ghost ${activeClass}`} onClick={() => cancelTimer(refKey)} title="Re-clic pour annuler">
        {activeLabel} ▸ {formatClock(remaining)}
      </button>
    );
  }
  return (
    <button
      className="btn-ghost"
      onClick={() => startTimer(kind, refKey, activeLabel, durationSec * 1000)}
      title={`Démarre ${formatClock(durationSec)}`}
    >
      {idleLabel}
    </button>
  );
}

/* ============ objectifs (inset sous les trackers) ============ */

function ObjectiveInset({ timers }: { timers: Map<string, TrackerTimer> }) {
  const { startTimer, cancelTimer, clockOffset } = useApp();
  const now = useNow();

  return (
    <div className="card-inset">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="kicker" style={{ fontSize: 10 }}>Objectifs</span>
        <span className="kicker" style={{ fontSize: 9.5 }}>Auto sur événement · clic en secours</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OBJECTIVES.map((obj) => {
          const refKey = `obj:${obj.id}`;
          const timer = timers.get(refKey);
          const remaining = timer ? Math.max(0, timer.expiresAt - (now + clockOffset)) / 1000 : null;
          if (remaining !== null) {
            return (
              <button key={obj.id} className="btn-ghost is-ad" onClick={() => cancelTimer(refKey)}>
                {obj.short} ▸ {formatClock(remaining)}
                {timer?.auto && <span style={{ opacity: 0.65, fontSize: 10 }}>AUTO</span>}
              </button>
            );
          }
          return (
            <button
              key={obj.id}
              className="btn-ghost"
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

/* ============ feed d'événements ============ */

const TAG_STYLE: Record<string, string> = {
  KILL: 'ok',
  DEATH: 'danger',
  OBJ: 'ad',
  WARD: '',
  FLASH: 'pink',
  ULT: 'ap',
  CAMP: 'ok',
  TOUR: '',
  INHIB: 'danger',
  START: 'ap',
};

function EventFeed({ events }: { events: LiveEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <div className="card">
      <CardHead title="Événements" right={<LiveChip on label="LIVE" />} />
      <div ref={ref} style={{ overflow: 'auto', maxHeight: 480, flex: 1 }}>
        {events.length === 0 && (
          <div style={{ padding: '28px 22px', fontSize: 13.5, color: 'var(--muted)' }}>
            En attente d'événements — kills, objectifs, wards et flashs apparaîtront ici.
          </div>
        )}
        {events.map((ev) => (
          <div key={ev.id} className="feed-row">
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: 'var(--neutral-chip-bg)',
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  transform: 'rotate(45deg)',
                  background: `var(--${TAG_STYLE[ev.tag] === 'ok' ? 'green' : TAG_STYLE[ev.tag] === 'danger' ? 'red' : TAG_STYLE[ev.tag] === 'ad' ? 'orange-bar' : TAG_STYLE[ev.tag] === 'pink' ? 'pink' : TAG_STYLE[ev.tag] === 'ap' ? 'acc' : 'muted'})`,
                }}
              />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.detail}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', marginTop: 1 }}>
                {formatClock(ev.timeSec)}
              </div>
            </div>
            <span className={`chip mono ${TAG_STYLE[ev.tag] ?? ''}`} style={{ fontSize: 9, fontWeight: 700 }}>
              {ev.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
