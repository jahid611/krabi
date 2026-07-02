import { Link } from 'react-router-dom';
import {
  championByKey,
  type AppSettings,
  type BanSlot,
  type CompAlert,
  type PlayerSlot,
  type TeamAnalysis,
} from '@krabi/shared';
import { useApp } from '../lib/store';
import { ChampTile, DamageBadge, EmptyState, PageHead } from '../components/ui';
import { formatRank, rankColor } from '../lib/format';

const POSITION_SHORT: Record<string, string> = {
  TOP: 'TOP',
  JUNGLE: 'JGL',
  MIDDLE: 'MID',
  BOTTOM: 'ADC',
  UTILITY: 'SUP',
};

export function DraftPage() {
  const { state } = useApp();
  const cs = state?.champSelect;
  const settings = state?.settings;

  if (!state || !cs || !settings) {
    return (
      <>
        <PageHead
          title="Draft"
          subtitle="Picks, bans, elo de tes alliés et alertes de compo — en direct pendant la champ select."
        />
        <EmptyState
          title="En attente de champ select"
          lines={[
            'Lance League of Legends et entre en sélection de champion —',
            'ta draft s’affichera ici automatiquement.',
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

  const timerSec = Math.ceil(cs.timerMs / 1000);

  return (
    <>
      <PageHead
        title="Draft"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
            <span className="chip ap" style={{ fontSize: 12, padding: '6px 12px' }}>
              {cs.phaseLabel}
            </span>
            <span
              className="chip mono"
              style={{
                fontSize: 13,
                padding: '6px 12px',
                fontWeight: 700,
                color: timerSec <= 5 ? 'var(--red)' : 'var(--txt)',
              }}
            >
              {String(timerSec).padStart(2, '0')}s
            </span>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 24,
          paddingBottom: 56,
        }}
      >
        <TeamCard
          title="Ton équipe"
          players={cs.allies}
          bans={cs.bans.filter((b) => b.side === 'ALLY')}
          analysis={state.analysis?.ally ?? null}
          ally
          settings={settings}
        />
        <TeamCard
          title="Équipe adverse"
          players={cs.enemies}
          bans={cs.bans.filter((b) => b.side === 'ENEMY')}
          analysis={state.analysis?.enemy ?? null}
          ally={false}
          settings={settings}
        />
      </div>
    </>
  );
}

interface TeamCardProps {
  title: string;
  players: PlayerSlot[];
  bans: BanSlot[];
  analysis: TeamAnalysis | null;
  ally: boolean;
  settings: AppSettings;
}

function TeamCard({ title, players, bans, analysis, ally, settings }: TeamCardProps) {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">{title}</span>
      </div>

      {/* bans */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 20px', borderBottom: '1px solid var(--border-soft)' }}>
        <span className="kicker" style={{ fontSize: 9.5 }}>Bans</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {bans.map((ban, i) => (
            <ChampTile key={i} championKey={ban.championId} size={24} banned />
          ))}
        </div>
      </div>

      <div>
        {players.map((player) => (
          <PlayerRow key={player.cellId} player={player} ally={ally} settings={settings} />
        ))}
      </div>

      {analysis && <AnalysisInset analysis={analysis} ally={ally} settings={settings} />}
    </div>
  );
}

function PlayerRow({ player, ally, settings }: { player: PlayerSlot; ally: boolean; settings: AppSettings }) {
  const champ = championByKey(player.championId);
  const acting = player.state === 'PICKING' || player.state === 'BANNING';

  return (
    <div className="player-row">
      <div style={{ position: 'relative', flex: 'none' }}>
        <ChampTile championKey={player.championId} size={40} />
        {player.isSelf && (
          <span
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 11,
              border: '2px solid var(--pink)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>
            {champ ? champ.name : acting ? 'En train de choisir…' : '—'}
          </span>
          {acting && (
            <span className="chip ok" style={{ fontSize: 9 }}>
              {player.state === 'BANNING' ? 'BAN EN COURS' : 'PICK EN COURS'}
            </span>
          )}
          {player.isSelf && <span className="chip pink" style={{ fontSize: 9 }}>TOI</span>}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', letterSpacing: '0.02em', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {POSITION_SHORT[player.position] ?? '—'}
          {ally && player.gameName && ` · ${player.gameName}#${player.tagLine}`}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 'none', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {ally && settings.draft.showElo && player.rank && <RankChip rank={player.rank} />}
        {ally && settings.draft.showForm && player.form && <FormChips form={player.form} />}
        {champ && <DamageBadge dmg={champ.dmg} />}
        {ally && settings.draft.showOpgg && player.opggUrl && (
          <a href={player.opggUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '4px 9px', fontSize: 10.5 }}>
            OP.GG ↗
          </a>
        )}
      </div>
    </div>
  );
}

function RankChip({ rank }: { rank: NonNullable<PlayerSlot['rank']> }) {
  const color = rankColor(rank);
  return (
    <span
      className="chip mono"
      style={{
        color: `color-mix(in srgb, ${color} 80%, #fff)`,
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        fontWeight: 700,
      }}
    >
      {formatRank(rank)}
    </span>
  );
}

function FormChips({ form }: { form: NonNullable<PlayerSlot['form']> }) {
  const total = form.wins + form.losses;
  const pct = total > 0 ? Math.round((form.wins / total) * 100) : 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {form.results.map((win, i) => (
        <span
          key={i}
          title={win ? 'Victoire' : 'Défaite'}
          style={{
            width: 8,
            height: 8,
            borderRadius: 3,
            display: 'inline-block',
            background: win ? 'var(--green-solid)' : 'var(--red-solid)',
          }}
        />
      ))}
      <span className={`chip ${pct >= 50 ? 'solid-win' : 'solid-loss'}`} style={{ fontSize: 10, marginLeft: 4, padding: '2px 6px' }}>
        {pct}%
      </span>
    </span>
  );
}

function AnalysisInset({ analysis, ally, settings }: { analysis: TeamAnalysis; ally: boolean; settings: AppSettings }) {
  const physPct = Math.round(analysis.physicalShare * 100);
  const magicPct = Math.round(analysis.magicShare * 100);

  return (
    <div className="card-inset">
      {settings.draft.damageAnalysis && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="dmg-bar">
            <div className="phys" style={{ width: `${physPct}%` }} />
            <div className="magic" style={{ width: `${magicPct}%` }} />
          </div>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--dim)', flex: 'none' }}>
            {physPct}% AD · {magicPct}% AP
          </span>
          {settings.draft.ccAnalysis && (
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted)', flex: 'none' }}>
              CC {analysis.ccLockSeconds.toFixed(1)}s
            </span>
          )}
        </div>
      )}

      {settings.draft.compAlerts &&
        analysis.alerts.map((alert) => <AlertBox key={alert.code} alert={alert} ally={ally} />)}
    </div>
  );
}

function AlertBox({ alert, ally }: { alert: CompAlert; ally: boolean }) {
  const cls = alert.severity === 'CRIT' ? 'crit' : alert.severity === 'WARN' ? 'warn' : 'info';
  return (
    <div className={`alert ${cls}`}>
      <span style={{ fontWeight: 800 }}>
        {alert.severity === 'CRIT' ? '⚑ ' : alert.severity === 'WARN' ? '⚠ ' : 'ℹ '}
      </span>
      {alert.message}
      {ally && alert.suggestions && alert.suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="kicker" style={{ fontSize: 9.5 }}>Suggestions ▸</span>
          {alert.suggestions.map((id) => (
            <span key={id} className="chip ap">
              {id.replace(/([a-z])([A-Z])/g, '$1 $2')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
