import { useState, useEffect } from 'react';
import { fetchTodaysGames, callBet, type ESPNGame, type BetCall } from '../utils/espnApi';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function SportIcon({ sport }: { sport: 'tennis' | 'football' }) {
  return <span>{sport === 'tennis' ? '🎾' : '⚽'}</span>;
}

function VerdictBadge({ verdict, confidence }: { verdict: 'bet' | 'skip'; confidence: 'high' | 'medium' | 'low' }) {
  if (verdict === 'bet') {
    const color = confidence === 'high' ? '#34d399' : confidence === 'medium' ? '#fbbf24' : '#94a3b8';
    const bg = confidence === 'high' ? 'rgba(52,211,153,0.12)' : confidence === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(148,163,184,0.1)';
    const label = confidence === 'high' ? '✅ BET' : confidence === 'medium' ? '✅ BET' : '✅ BET (LOW CONF)';
    return <span style={{ background: bg, color, borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>;
  }
  return <span style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>🚫 SKIP</span>;
}

function ConfidenceDots({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const filled = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i <= filled ? (confidence === 'high' ? 'var(--green)' : confidence === 'medium' ? '#fbbf24' : 'var(--text-muted)') : 'var(--border)' }} />
      ))}
    </div>
  );
}

type SportFilter = 'all' | 'tennis' | 'football';
type VerdictFilter = 'all' | 'bet' | 'skip';

export default function TodaysGames() {
  const [games, setGames] = useState<ESPNGame[]>([]);
  const [calls, setCalls] = useState<BetCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('bet');

  useEffect(() => {
    fetchTodaysGames()
      .then(g => {
        setGames(g);
        setCalls(g.map(callBet));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const displayed = calls.filter(c => {
    if (sportFilter !== 'all' && c.game.sport !== sportFilter) return false;
    if (verdictFilter !== 'all' && c.verdict !== verdictFilter) return false;
    if (c.game.status === 'finished') return false;
    return true;
  });

  const betCount = calls.filter(c => c.verdict === 'bet' && c.game.status !== 'finished').length;
  const skipCount = calls.filter(c => c.verdict === 'skip' && c.game.status !== 'finished').length;
  const tennisCount = calls.filter(c => c.game.sport === 'tennis' && c.game.status !== 'finished').length;
  const footballCount = calls.filter(c => c.game.sport === 'football' && c.game.status !== 'finished').length;

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Today's Games</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{today} · Live data from ESPN</div>
          </div>
          {!loading && !error && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--green)', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600 }}>{betCount} BET</span>
              <span style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--red)', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600 }}>{skipCount} SKIP</span>
            </div>
          )}
        </div>

        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Strategy based on odds analysis and ranking data. <strong style={{ color: 'var(--text-secondary)' }}>Log your bets</strong> in History to unlock personalised recommendations based on your own win rates.
        </p>
      </div>

      {/* Filters */}
      {!loading && !error && games.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
            {(['all', 'bet', 'skip'] as VerdictFilter[]).map(f => (
              <button key={f} onClick={() => setVerdictFilter(f)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: verdictFilter === f ? 'var(--accent)' : 'transparent', color: verdictFilter === f ? '#fff' : 'var(--text-muted)' }}>
                {f === 'all' ? 'All' : f === 'bet' ? `✅ Bets (${betCount})` : `🚫 Skips (${skipCount})`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
            {(['all', 'tennis', 'football'] as SportFilter[]).map(f => (
              <button key={f} onClick={() => setSportFilter(f)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: sportFilter === f ? 'var(--accent)' : 'transparent', color: sportFilter === f ? '#fff' : 'var(--text-muted)' }}>
                {f === 'all' ? `All (${tennisCount + footballCount})` : f === 'tennis' ? `🎾 Tennis (${tennisCount})` : `⚽ Football (${footballCount})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Fetching today's games from ESPN...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '14px 18px', color: 'var(--red)', fontSize: 13 }}>
          Could not load games: {error}
        </div>
      )}

      {/* No games */}
      {!loading && !error && displayed.length === 0 && games.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>
          No {sportFilter !== 'all' ? sportFilter : ''} games match this filter today.
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14 }}>No tennis or football games scheduled today.</div>
        </div>
      )}

      {/* Game cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayed.map((call, i) => {
          const g = call.game;
          const isLive = g.status === 'live';
          return (
            <div key={g.id + i} style={{ background: 'var(--card-bg)', border: `1px solid ${isLive ? 'rgba(79,124,255,0.4)' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Top row */}
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <SportIcon sport={g.sport} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{g.league}</span>
                    {isLive && <span style={{ background: 'rgba(79,124,255,0.15)', color: 'var(--accent)', borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>LIVE</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(g.commenceTime)}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>
                    {g.awayTeam} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs</span> {g.homeTeam}
                  </div>
                  {(g.homeRank || g.awayRank) && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {g.awayRank ? `#${g.awayRank}` : '—'} vs {g.homeRank ? `#${g.homeRank}` : '—'} world ranking
                    </div>
                  )}
                  {(g.homeRecord || g.awayRecord) && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {g.awayRecord ?? '—'} vs {g.homeRecord ?? '—'} record
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <VerdictBadge verdict={call.verdict} confidence={call.confidence} />
                  <ConfidenceDots confidence={call.confidence} />
                </div>
              </div>

              {/* Recommendation row */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--table-alt-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  {call.verdict === 'bet' && call.selection !== '—' && (
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bet on: </span>
                      <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 14 }}>{call.selection}</span>
                      {call.odds && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>@ {call.odds.toFixed(2)}</span>}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{call.reason}</div>
                </div>
                {g.homeOdds && g.awayOdds && (
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>{g.awayTeam.split(' ').pop()}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.awayOdds.toFixed(2)}</div>
                    </div>
                    {g.drawOdds && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Draw</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.drawOdds.toFixed(2)}</div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>{g.homeTeam.split(' ').pop()}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.homeOdds.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
