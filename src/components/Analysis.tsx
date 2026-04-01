import type { Bet } from '../types';
import { getEdgeBySport, getEdgeByBetType, getEdgeByOddsRange, type EdgeRow } from '../utils/stats';

interface AnalysisProps {
  bets: Bet[];
}

function EdgeTable({ rows, title }: { rows: EdgeRow[]; title: string }) {
  if (rows.length === 0) return null;

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              {['Category', 'Bets', 'Win Rate', 'Break-Even', 'Edge', 'Avg Odds', 'ROI', 'P/L'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Category' ? 'left' : 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const edgeColor = row.edge > 0 ? 'var(--green)' : 'var(--red)';
              return (
                <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--table-alt-bg)' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.label}</span>
                      {!row.reliable && (
                        <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>
                          LOW DATA
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.bets}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>{row.winRate}%</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{row.breakEven}%</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: edgeColor }}>
                    {row.edge > 0 ? '+' : ''}{row.edge}%
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.avgOdds}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: row.roi >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                    {row.roi >= 0 ? '+' : ''}{row.roi}%
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: row.profitLoss >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                    {row.profitLoss >= 0 ? '+$' : '-$'}{Math.abs(row.profitLoss).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Callout({ type, children }: { type: 'good' | 'bad' | 'info'; children: React.ReactNode }) {
  const styles = {
    good: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', icon: '✅' },
    bad:  { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '⚠️' },
    info: { bg: 'rgba(79,124,255,0.08)', border: 'rgba(79,124,255,0.25)', icon: 'ℹ️' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span>{s.icon}</span>
      <span>{children}</span>
    </div>
  );
}

function generateInsights(bySport: EdgeRow[], byType: EdgeRow[], byOdds: EdgeRow[]) {
  const insights: { type: 'good' | 'bad' | 'info'; text: string }[] = [];

  const reliableSport = bySport.filter(r => r.reliable);
  const reliableType = byType.filter(r => r.reliable);

  if (reliableSport.length === 0 && reliableType.length === 0) {
    insights.push({ type: 'info', text: 'Track at least 10 settled bets per category to get reliable edge analysis. Keep logging!' });
    return insights;
  }

  const bestSport = reliableSport[0];
  const worstSport = reliableSport[reliableSport.length - 1];
  const bestType = reliableType[0];
  const worstType = reliableType[reliableType.length - 1];

  if (bestSport?.edge > 3) {
    insights.push({ type: 'good', text: `Your strongest sport is ${bestSport.label} — ${bestSport.edge}% edge over break-even (${bestSport.winRate}% win rate vs ${bestSport.breakEven}% needed). Focus here.` });
  }
  if (worstSport?.edge < -3 && worstSport.label !== bestSport?.label) {
    insights.push({ type: 'bad', text: `Avoid ${worstSport.label} — you're ${Math.abs(worstSport.edge)}% below break-even. This sport is costing you money.` });
  }
  if (bestType?.edge > 3) {
    insights.push({ type: 'good', text: `${bestType.label} bets are your best bet type — ${bestType.edge}% edge. Stick to these.` });
  }
  if (worstType?.edge < -5) {
    insights.push({ type: 'bad', text: `Stop betting ${worstType.label} — ${worstType.edge}% edge. You're losing significantly on these.` });
  }

  const bestOdds = byOdds.filter(r => r.reliable).sort((a, b) => b.edge - a.edge)[0];
  if (bestOdds?.edge > 0) {
    insights.push({ type: 'good', text: `You perform best at ${bestOdds.label} odds — ${bestOdds.edge}% edge. Target this range.` });
  }

  const parlayRow = reliableType.find(r => r.label.toLowerCase() === 'parlay');
  if (parlayRow && parlayRow.edge < -5) {
    insights.push({ type: 'bad', text: `Parlays are a money drain for you (${parlayRow.roi}% ROI). The math rarely works in your favour.` });
  }

  return insights;
}

export default function Analysis({ bets }: AnalysisProps) {
  const bySport = getEdgeBySport(bets);
  const byType = getEdgeByBetType(bets);
  const byOdds = getEdgeByOddsRange(bets);
  const insights = generateInsights(bySport, byType, byOdds);

  const settled = bets.filter(b => b.result !== 'pending' && b.result !== 'void');

  if (settled.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No data to analyse yet</h2>
        <p style={{ fontSize: 14 }}>Add and settle some bets to see your edge analysis.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* What is edge? */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>How to read this:</strong> "Edge" = your actual win rate minus the win rate needed to break even at those odds.
          A <span style={{ color: 'var(--green)', fontWeight: 600 }}>positive edge</span> means you're beating the market in that category.
          A <span style={{ color: 'var(--red)', fontWeight: 600 }}>negative edge</span> means the bookmaker is winning. "LOW DATA" means fewer than 10 bets — not reliable yet.
        </p>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map((ins, i) => (
            <Callout key={i} type={ins.type}>{ins.text}</Callout>
          ))}
        </div>
      )}

      <EdgeTable rows={bySport} title="Edge by Sport" />
      <EdgeTable rows={byType} title="Edge by Bet Type" />
      <EdgeTable rows={byOdds} title="Edge by Odds Range" />
    </div>
  );
}
