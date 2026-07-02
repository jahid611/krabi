import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CAMPS,
  OBJECTIVES,
  SUMMONER_SPELLS,
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
import { campIconSrcs, campType, MINIMAP_SRCS, spellIconSrcs, ultIconSrcs } from '../lib/format';

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
          title="En direct"
          subtitle="Sorts et ults ennemis, camps et objectifs — tes timers au bon endroit."
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
      <PageHead
        title="En direct"
        right={
          <span className="chip mono" style={{ fontSize: 12.5, padding: '5px 10px', fontWeight: 700 }}>
            {formatClock(live.gameTimeSec)}
          </span>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
          paddingBottom: 40,
        }}
      >
        {settings.live.campTimers && (
          <div className="card">
            <CardHead title="Jungle" right={<span className="kicker" style={{ fontSize: 10 }}>clic ▸ timer</span>} />
            <MapBoard timers={timers} showObjectives={settings.live.objectiveTimers} />
          </div>
        )}

        <div className="card">
          <CardHead title="Ennemis" />
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

/* ============ carte : vraie minimap + marqueurs ============ */

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
    <div style={{ padding: 12 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          borderRadius: 6,
          overflow: 'hidden',
          background: 'var(--inset)',
        }}
      >
        {/* vraie minimap ; repli sur un fond stylisé si aucune source ne charge */}
        <ImgChain
          srcs={MINIMAP_SRCS}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          fallback={
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <rect width="100" height="100" fill="var(--inset)" />
              <polygon points="0,0 12,0 100,88 100,100 88,100 0,12" fill="var(--acc)" opacity="0.08" />
              <polygon points="0,100 8,92 100,0 92,0 0,92" fill="#b5bac1" opacity="0.1" />
            </svg>
          }
        />

        {CAMPS.map((camp) => {
          const refKey = `camp:${camp.id}`;
          const rem = remaining(refKey);
          return (
            <MapMarker
              key={camp.id}
              x={camp.x}
              y={camp.y}
              size={24}
              active={rem !== null}
              countdown={rem}
              title={`${camp.label} — respawn ${formatClock(camp.respawnSec)}`}
              onClick={() => toggle('CAMP', refKey, camp.label, camp.respawnSec)}
              icon={
                <ImgChain
                  srcs={campIconSrcs(campType(camp.id))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallback={<span className="mono" style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--txt-2)' }}>{camp.short}</span>}
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
                size={30}
                active={rem !== null}
                countdown={rem}
                title={`${obj.label} — respawn ${formatClock(obj.respawnSec)}`}
                onClick={() => toggle('OBJECTIVE', refKey, obj.short, obj.respawnSec)}
                icon={
                  <ImgChain
                    srcs={campIconSrcs(obj.id)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={<span className="mono" style={{ fontSize: 8, fontWeight: 700, color: 'var(--orange)' }}>{obj.short}</span>}
                  />
                }
              />
            );
          })}
      </div>
      <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--faint)' }}>
        Buffs 5:00 · camps 2:15 · sentinelles 2:30 — re-clic pour annuler.
      </div>
    </div>
  );
}

function MapMarker({
  x,
  y,
  size,
  active,
  countdown,
  title,
  onClick,
  icon,
}: {
  x: number;
  y: number;
  size: number;
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
        gap: 1,
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
          background: 'rgba(0, 0, 0, 0.55)',
          border: active ? '2px solid var(--acc)' : '1px solid rgba(255, 255, 255, 0.35)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
          filter: active ? 'grayscale(0.8)' : undefined,
        }}
      >
        {icon}
      </span>
      {countdown !== null && (
        <span
          className="mono"
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            background: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 4,
            padding: '0 4px',
            lineHeight: 1.5,
          }}
        >
          {formatClock(countdown)}
        </span>
      )}
    </button>
  );
}

/* ============ ennemis : sorts (x2) + R, icônes seules ============ */

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
      <ChampTile championKey={player.championId} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.1 }}>{champ?.name ?? '—'}</div>
        <div
          className="mono"
          style={{ fontSize: 10, color: 'var(--faint)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {player.level} · {player.kills}/{player.deaths}/{player.assists}
          {player.isDead && <span style={{ color: 'var(--red)', fontWeight: 700 }}> · {player.respawnIn}s</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, flex: 'none' }}>
        {settings.live.flashTimers &&
          player.spells.map((spellId, slot) => (
            <SpellButton key={slot} player={player} spellId={spellId} slot={slot} timers={timers} />
          ))}
        {settings.live.ultTimers && <UltButton player={player} timers={timers} />}
      </div>
    </div>
  );
}

/** Bouton-icône générique : clic ▸ timer, re-clic ▸ annule, countdown superposé. */
function IconTimerButton({
  refKey,
  kind,
  label,
  durationSec,
  srcs,
  fallbackText,
  disabled,
  timers,
}: {
  refKey: string;
  kind: 'FLASH' | 'ULT';
  label: string;
  durationSec: number;
  srcs: string[];
  fallbackText: string;
  disabled?: boolean;
  timers: Map<string, TrackerTimer>;
}) {
  const { startTimer, cancelTimer, clockOffset } = useApp();
  const now = useNow();
  const timer = timers.get(refKey);
  const remaining = timer ? Math.max(0, timer.expiresAt - (now + clockOffset)) / 1000 : null;
  const cooling = remaining !== null;

  return (
    <button
      className={`icon-btn${cooling ? ' cooling' : ''}`}
      disabled={disabled}
      title={disabled ? `${label} — pas encore disponible` : `${label} · ${formatClock(durationSec)}`}
      onClick={() => (cooling ? cancelTimer(refKey) : startTimer(kind, refKey, label, durationSec * 1000))}
    >
      <ImgChain
        srcs={srcs}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        fallback={
          cooling ? null : (
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)' }}>{fallbackText}</span>
          )
        }
      />
      {cooling && <span className="cd">{formatClock(remaining)}</span>}
    </button>
  );
}

function SpellButton({
  player,
  spellId,
  slot,
  timers,
}: {
  player: LivePlayer;
  spellId: string;
  slot: number;
  timers: Map<string, TrackerTimer>;
}) {
  const def = SUMMONER_SPELLS[spellId];
  if (!def) return null;
  return (
    <IconTimerButton
      refKey={`spell:${player.index}:${slot}`}
      kind="FLASH"
      label={def.label}
      durationSec={def.cd}
      srcs={spellIconSrcs(spellId)}
      fallbackText={def.label.slice(0, 2)}
      timers={timers}
    />
  );
}

function UltButton({ player, timers }: { player: LivePlayer; timers: Map<string, TrackerTimer> }) {
  const cd = ultCooldownSeconds(player.championId, player.level);
  return (
    <IconTimerButton
      refKey={`ult:${player.index}`}
      kind="ULT"
      label="R"
      durationSec={cd ?? 0}
      srcs={ultIconSrcs(player.championId)}
      fallbackText="R"
      disabled={cd === null}
      timers={timers}
    />
  );
}

/* ============ objectifs ============ */

function ObjectiveInset({ timers }: { timers: Map<string, TrackerTimer> }) {
  const { startTimer, cancelTimer, clockOffset } = useApp();
  const now = useNow();

  return (
    <div className="card-inset">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="kicker" style={{ fontSize: 10 }}>Objectifs</span>
        {OBJECTIVES.map((obj) => {
          const refKey = `obj:${obj.id}`;
          const timer = timers.get(refKey);
          const rem = timer ? Math.max(0, timer.expiresAt - (now + clockOffset)) / 1000 : null;
          const cooling = rem !== null;
          return (
            <button
              key={obj.id}
              className={`icon-btn${cooling ? ' cooling' : ''}`}
              title={`${obj.label} · respawn ${formatClock(obj.respawnSec)}${timer?.auto ? ' (auto)' : ''}`}
              onClick={() =>
                cooling ? cancelTimer(refKey) : startTimer('OBJECTIVE', refKey, obj.short, obj.respawnSec * 1000)
              }
            >
              <ImgChain
                srcs={campIconSrcs(obj.id)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallback={
                  cooling ? null : (
                    <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: 'var(--orange)' }}>{obj.short}</span>
                  )
                }
              />
              {cooling && <span className="cd">{formatClock(rem)}</span>}
            </button>
          );
        })}
        <span style={{ fontSize: 11, color: 'var(--faint)', marginLeft: 'auto' }}>auto sur événement</span>
      </div>
    </div>
  );
}

/* ============ fil des événements ============ */

const TAG_COLOR: Record<string, string> = {
  KILL: 'var(--green)',
  DEATH: 'var(--red)',
  OBJ: 'var(--orange)',
  WARD: 'var(--muted)',
  FLASH: 'var(--pink)',
  ULT: 'var(--acc)',
  CAMP: 'var(--green)',
  TOUR: 'var(--muted)',
  INHIB: 'var(--red)',
  START: 'var(--acc)',
};

function EventFeed({ events }: { events: LiveEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <div className="card">
      <CardHead title="Événements" />
      <div ref={ref} style={{ overflow: 'auto', maxHeight: 460, flex: 1 }}>
        {events.length === 0 && (
          <div style={{ padding: '24px 16px', fontSize: 13, color: 'var(--muted)' }}>
            Kills, objectifs, wards et flashs apparaîtront ici.
          </div>
        )}
        {events.map((ev) => (
          <div key={ev.id} className="feed-row">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: TAG_COLOR[ev.tag] ?? 'var(--muted)',
                flex: 'none',
              }}
            />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ev.detail}
            </span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', flex: 'none' }}>
              {formatClock(ev.timeSec)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
