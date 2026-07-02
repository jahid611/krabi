import { Link } from 'react-router-dom';
import {
  championByKey,
  type BanSlot,
  type CompAlert,
  type PlayerSlot,
  type TeamAnalysis,
} from '@krabi/shared';
import { useApp } from '../lib/store';
import { ChampTile, DamageBadge, EmptyState, PanelHead, SectionHead } from '../components/ui';
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
        <SectionHead num="01" title="Analyse de draft" comment="// CLONE LIVE DE LA CHAMP SELECT" />
        <EmptyState
          title="EN ATTENTE DE CHAMP SELECT"
          lines={[
            'Lance le client League of Legends et entre en sélection de champion,',
            'ou active le mode démo pour voir le module tourner.',
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

  const timerSec = Math.ceil(cs.timerMs / 1000);

  return (
    <>
      <SectionHead num="01" title="Analyse de draft" comment="// CLONE LIVE DE LA CHAMP SELECT" />

      {/* barre de phase */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          padding: '12px 24px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)',
          flexWrap: 'wrap',
        }}
      >
        <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, letterSpacing: '0.06em' }}>
          <span className="dot" />
          <span style={{ color: 'var(--txt-2)' }}>{cs.phaseLabel}</span>
        </div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: timerSec <= 5 ? 'var(--warn)' : 'var(--acc)' }}>
          {String(timerSec).padStart(2, '0')}s
        </div>
      </div>

      <BansStrip bans={cs.bans} />

      {/* équipes */}
      <div className="grid-joint" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
        <TeamPanel
          title="ÉQUIPE ALLIÉE"
          players={cs.allies}
          analysis={state.analysis?.ally ?? null}
          ally
          settings={settings}
        />
        <TeamPanel
          title="ÉQUIPE ENNEMIE"
          players={cs.enemies}
          analysis={state.analysis?.enemy ?? null}
          ally={false}
          settings={settings}
        />
      </div>
    </>
  );
}

function BansStrip({ bans }: { bans: BanSlot[] }) {
  const side = (s: 'ALLY' | 'ENEMY') => bans.filter((b) => b.side === s);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 20,
        padding: '10px 24px',
        borderBottom: '1px solid var(--line)',
        flexWrap: 'wrap',
      }}
    >
      {(['ALLY', 'ENEMY'] as const).map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', letterSpacing: '0.08em' }}>
            BANS {s === 'ALLY' ? 'ALLIÉS' : 'ENNEMIS'}
          </span>
          {side(s).map((ban, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <ChampTile championKey={ban.championId} size={26} dimmed />
              {ban.championId > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--warn)',
                    fontSize: 15,
                    fontFamily: 'var(--mono)',
                  }}
                >
                  ✕
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface TeamPanelProps {
  title: string;
  players: PlayerSlot[];
  analysis: TeamAnalysis | null;
  ally: boolean;
  settings: NonNullable<ReturnType<typeof useApp>['state']>['settings'];
}

function TeamPanel({ title, players, analysis, ally, settings }: TeamPanelProps) {
  return (
    <div className="panel cell">
      <PanelHead
        title={ally ? 'ALLY_TEAM' : 'ENEMY_TEAM'}
        live={ally}
        warn={!ally}
        right={<span style={{ color: 'var(--faint)' }}>{title}</span>}
      />
      <div>
        {players.map((player) => (
          <PlayerRow key={player.cellId} player={player} ally={ally} settings={settings} />
        ))}
      </div>
      {analysis && <AnalysisBlock analysis={analysis} ally={ally} settings={settings} />}
    </div>
  );
}

function PlayerRow({ player, ally, settings }: { player: PlayerSlot; ally: boolean; settings: TeamPanelProps['settings'] }) {
  const champ = championByKey(player.championId);
  const acting = player.state === 'PICKING' || player.state === 'BANNING';

  return (
    <div
      className="row-line"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        background: player.isSelf ? '#060d08' : undefined,
      }}
    >
      <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', width: 28, flex: 'none' }}>
        {POSITION_SHORT[player.position] ?? '—'}
      </span>
      <ChampTile championKey={player.championId} size={34} />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
            {champ ? champ.name : acting ? '…' : '—'}
          </span>
          {champ && <DamageBadge dmg={champ.dmg} />}
          {champ && settings.draft.ccAnalysis && (
            <span className="mono" style={{ fontSize: 11, color: 'var(--dim)' }}>
              CC {Math.round(champ.cc * 10) / 10}s
            </span>
          )}
          {acting && (
            <span
              className="mono"
              style={{ fontSize: 9, color: 'var(--acc)', letterSpacing: '0.08em', animation: 'blink 1.2s ease-in-out infinite' }}
            >
              ● {player.state === 'BANNING' ? 'EN BAN' : 'EN PICK'}
            </span>
          )}
        </div>
        {ally && player.gameName && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--dim-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.gameName}
            <span style={{ color: 'var(--ghost)' }}>#{player.tagLine}</span>
            {player.isSelf && <span className="ok"> · TOI</span>}
          </div>
        )}
      </div>

      {ally && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
          {settings.draft.showElo && player.rank && (
            <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: rankColor(player.rank), whiteSpace: 'nowrap' }}>
              {formatRank(player.rank)}
            </span>
          )}
          {settings.draft.showForm && player.form && <FormChips form={player.form} />}
          {settings.draft.showOpgg && player.opggUrl && (
            <a href={player.opggUrl} target="_blank" rel="noopener noreferrer" className="ext-link">
              OP.GG ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function FormChips({ form }: { form: NonNullable<PlayerSlot['form']> }) {
  const total = form.wins + form.losses;
  const pct = total > 0 ? Math.round((form.wins / total) * 100) : 0;
  return (
    <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
      {form.results.map((win, i) => (
        <span
          key={i}
          title={win ? 'Victoire' : 'Défaite'}
          style={{
            width: 9,
            height: 9,
            display: 'inline-block',
            background: win ? 'var(--acc)' : 'transparent',
            border: `1px solid ${win ? 'var(--acc)' : 'var(--warn)'}`,
          }}
        />
      ))}
      <span style={{ color: pct >= 50 ? 'var(--acc)' : 'var(--warn)', marginLeft: 3 }}>{pct}%</span>
    </span>
  );
}

function AnalysisBlock({ analysis, ally, settings }: { analysis: TeamAnalysis; ally: boolean; settings: TeamPanelProps['settings'] }) {
  const physPct = Math.round(analysis.physicalShare * 100);
  const magicPct = Math.round(analysis.magicShare * 100);

  return (
    <div style={{ borderTop: '1px solid var(--line)', background: 'var(--panel)', padding: '12px 14px', marginTop: 'auto' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', letterSpacing: '0.08em', marginBottom: 8 }}>
        // ANALYSE — {analysis.pickedCount}/5 PICKS
      </div>

      {settings.draft.damageAnalysis && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--dim-2)', width: 76, flex: 'none' }}>
            DÉGÂTS {analysis.adCount}AD/{analysis.apCount}AP
            {analysis.hybridCount > 0 ? `/${analysis.hybridCount}H` : ''}
          </span>
          <div className="dmg-bar" style={{ flex: 1 }}>
            <div className="phys" style={{ width: `${physPct}%` }} />
            <div className="magic" style={{ width: `${magicPct}%` }} />
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--dim)', flex: 'none' }}>
            <span className="crit">{physPct}%</span> / <span className="ok">{magicPct}%</span>
          </span>
        </div>
      )}

      {settings.draft.ccAnalysis && (
        <div className="mono" style={{ fontSize: 11, color: 'var(--dim)', marginBottom: settings.draft.compAlerts ? 8 : 0 }}>
          CC LOCK <span style={{ color: 'var(--txt-2)' }}>{analysis.ccLockSeconds.toFixed(2)}s</span>
        </div>
      )}

      {settings.draft.compAlerts &&
        analysis.alerts.map((alert) => <AlertLine key={alert.code} alert={alert} ally={ally} />)}
    </div>
  );
}

function AlertLine({ alert, ally }: { alert: CompAlert; ally: boolean }) {
  const color = alert.severity === 'CRIT' ? 'var(--warn)' : alert.severity === 'WARN' ? '#e8ff3a' : 'var(--dim)';
  return (
    <div
      className="mono"
      style={{
        fontSize: 11,
        lineHeight: 1.6,
        border: '1px solid var(--line)',
        borderLeft: `2px solid ${color}`,
        padding: '7px 10px',
        marginTop: 6,
        background: '#030303',
      }}
    >
      <span style={{ color, fontWeight: 700 }}>
        {alert.severity === 'CRIT' ? '[ ! ] ' : alert.severity === 'WARN' ? '[ ⚠ ] ' : '[ i ] '}
      </span>
      <span style={{ color: 'var(--dim)' }}>{alert.message}</span>
      {ally && alert.suggestions && alert.suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--faint)', fontSize: 10 }}>SUGGESTIONS ▸</span>
          {alert.suggestions.map((id) => (
            <SuggestionChip key={id} ddragonId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionChip({ ddragonId }: { ddragonId: string }) {
  const name = ddragonId.replace(/([a-z])([A-Z])/g, '$1 $2');
  return (
    <span className="badge ap" style={{ fontSize: 9.5 }}>
      {name.toUpperCase()}
    </span>
  );
}
