import { useEffect, useMemo, useRef, type ReactNode } from 'react';
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
import { CardHead, ChampTile, EmptyState, ImgChain, PageHead } from '../components/ui';
import { FloatingDecor } from '../components/Decor';
import { campIconSrcs, campType, FLASH_ICON_SRCS, ultIconSrcs } from '../lib/format';

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
        <FloatingDecor page="live" />
        <PageHead
          kicker="En direct"
          title="Ta partie, chronométrée."
          subtitle="Flash et ults ennemis, camps de jungle et objectifs — tous tes timers au bon endroit."
        />
        <EmptyState
          title="Aucune partie en cours"
          lines={[
            'Ta partie sera détectée automatiquement dès que tu seras en jeu.',
            'En attendant, tu peux essayer le mode démo.',
          ]}
          action={
            <Link to="/settings" className="btn-primary">
              Essayer le mode démo
            </Link>
          }
        />
      </>
    );
  }

  const enemies = live.players.filter((p) => p.isEnemy);

  return (
    <>
      <FloatingDecor page="live" />
      <PageHead
        kicker="En direct"
        title="Ta partie, chronométrée."
        subtitle="Flash et ults ennemis, camps de jungle et objectifs — tous tes timers au bon endroit."
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

/* ============ carte de la faille ============ */

const CAMP_COLORS: Record<string, string> = {
  BLUE: '#5b8def',
  RED: '#e8734d',
  RIVER: '#37d67d',
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
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          borderRadius: 14,
          background: 'var(--inset)',
          border: '1px solid var(--border-soft)',
          overflow: 'hidden',
        }}
      >
        {/* fond : rivière, voies, bases */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <polygon points="0,0 12,0 100,88 100,100 88,100 0,12" fill="var(--acc)" opacity="0.07" />
          <polygon points="0,100 8,92 100,0 92,0 0,92" fill="#aab3d0" opacity="0.10" />
          <rect x="0" y="0" width="7" height="100" fill="#aab3d0" opacity="0.08" />
          <rect x="0" y="0" width="100" height="7" fill="#aab3d0" opacity="0.08" />
          <rect x="93" y="0" width="7" height="100" fill="#aab3d0" opacity="0.08" />
          <rect x="0" y="93" width="100" height="7" fill="#aab3d0" opacity="0.08" />
          <rect x="1.5" y="85.5" width="13" height="13" rx="3" fill="none" stroke="#5b8def" strokeOpacity="0.5" strokeWidth="0.6" />
          <rect x="85.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="#e8734d" strokeOpacity="0.5" strokeWidth="0.6" />
        </svg>

        {CAMPS.map((camp) => {
          const refKey = `camp:${camp.id}`;
          const rem = remaining(refKey);
          const type = campType(camp.id);
          return (
            <MapMarker
              key={camp.id}
              x={camp.x}
              y={camp.y}
              size={30}
              color={CAMP_COLORS[camp.side]}
              active={rem !== null}
              countdown={rem}
              title={`${camp.label} — respawn ${formatClock(camp.respawnSec)}`}
              onClick={() => toggle('CAMP', refKey, camp.label, camp.respawnSec)}
              icon={
                <ImgChain
                  srcs={campIconSrcs(type)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallback={<span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-2)' }}>{camp.short}</span>}
                />
              }
            />
          );
        })}

        {showObjectives &&
          OBJECTIVES.filter((o) => o.id !== 'herald').map((obj) => {
            const refKey = `obj:${obj.id}`;
            const rem = remaining(refKey);
            return (
              <MapMarker
                key={obj.id}
                x={obj.x}
                y={obj.y}
                size={38}
                color="var(--orange-bar)"
                active={rem !== null}
                countdown={rem}
                title={`${obj.label} — respawn ${formatClock(obj.respawnSec)}`}
                onClick={() => toggle('OBJECTIVE', refKey, obj.short, obj.respawnSec)}
                icon={
                  <ImgChain
                    srcs={campIconSrcs(obj.id)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={<span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--orange)' }}>{obj.short}</span>}
                  />
                }
              />
            );
          })}
      </div>

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

function MapMarker({
  x,
  y,
  size,
  color,
  active,
  countdown,
  title,
  onClick,
  icon,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  active: boolean;
  countdown: number | null;
  title: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${(1 - y) * 100}%`,
        transform: 'translate(-50%, -50%)',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        zIndex: active ? 3 : 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(8, 10, 20, 0.85)',
          border: `2px solid ${active ? 'var(--acc-2)' : color}`,
          boxShadow: active ? '0 0 12px rgba(124, 92, 255, 0.65)' : '0 2px 8px rgba(0, 0, 0, 0.5)',
          opacity: active ? 1 : 0.92,
        }}
      >
        {icon}
      </span>
      {countdown !== null && (
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#fff',
            background: 'rgba(8, 10, 20, 0.85)',
            border: '1px solid var(--acc)',
            borderRadius: 5,
            padding: '1px 5px',
            lineHeight: 1.4,
          }}
        >
          {formatClock(countdown)}
        </span>
      )}
    </button>
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
            icon={<ImgChain srcs={FLASH_ICON_SRCS} style={{ width: 18, height: 18, borderRadius: 4, display: 'block' }} fallback={<span>⚡</span>} />}
            idleLabel="Flash"
            activeLabel=""
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
  const icon = (
    <ImgChain
      srcs={ultIconSrcs(player.championId)}
      style={{ width: 18, height: 18, borderRadius: 4, display: 'block', filter: cd === null ? 'grayscale(1)' : undefined }}
      fallback={<span>R</span>}
    />
  );
  if (cd === null) {
    return (
      <button className="btn-ghost" disabled>
        {icon} niv 6
      </button>
    );
  }
  return (
    <TrackerButton
      refKey={`ult:${player.index}`}
      icon={icon}
      idleLabel={formatClock(cd)}
      activeLabel=""
      kind="ULT"
      durationSec={cd}
      timers={timers}
      activeClass="is-ap"
    />
  );
}

function TrackerButton({
  refKey,
  icon,
  idleLabel,
  activeLabel,
  kind,
  durationSec,
  timers,
  activeClass,
}: {
  refKey: string;
  icon: ReactNode;
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
        {icon} {activeLabel && `${activeLabel} `}{formatClock(remaining)}
      </button>
    );
  }
  return (
    <button
      className="btn-ghost"
      onClick={() => startTimer(kind, refKey, kind === 'FLASH' ? 'Flash' : 'R', durationSec * 1000)}
      title={`Démarre ${formatClock(durationSec)}`}
    >
      {icon} {idleLabel}
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
        <span className="kicker" style={{ fontSize: 9.5 }}>Démarrage automatique · clic en secours</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OBJECTIVES.map((obj) => {
          const refKey = `obj:${obj.id}`;
          const timer = timers.get(refKey);
          const rem = timer ? Math.max(0, timer.expiresAt - (now + clockOffset)) / 1000 : null;
          const icon = (
            <ImgChain
              srcs={campIconSrcs(obj.id)}
              style={{ width: 18, height: 18, borderRadius: 4, display: 'block' }}
              fallback={
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 2,
                    transform: 'rotate(45deg)',
                    background: 'var(--orange-bar)',
                    display: 'inline-block',
                  }}
                />
              }
            />
          );
          if (rem !== null) {
            return (
              <button key={obj.id} className="btn-ghost is-ad" onClick={() => cancelTimer(refKey)}>
                {icon} {formatClock(rem)}
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
              {icon} {obj.short} {formatClock(obj.respawnSec)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ fil des événements ============ */

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
      <CardHead title="Événements" right={<span className="chip ok">EN DIRECT</span>} />
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
