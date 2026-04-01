import { useState, useCallback } from 'react';
import type { Bet } from '../types';
import { fetchOdds, mapSport, mapBetType, formatTime, type ValueBet, type OddsGame } from '../utils/oddsApi';
import { analyzeBet, formatOddsAmerican } from '../utils/stats';
import { DEMO_GAMES, DEMO_SPORT_KEYS } from '../utils/demoData';

interface FindBetsProps {
  bets: Bet[];
  apiKey: string;
  bankroll: number;
  onNeedKey: () => void;
  demoMode?: boolean;
}

const POPULAR_SPORTS = [
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'icehockey_nhl', label: 'NHL' },
  { key: 'soccer_epl', label: 'Premier League' },
  { key: 'soccer_usa_mls', label: 'MLS' },
  { key: 'mma_mixed_martial_arts', label: 'MMA' },
];

type FilterVerdict = 'all' | 'strong' | 'lean';

export default function FindBets({ bets, apiKey, bankroll, onNeedKey, demoMode }: FindBetsProps) {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [valueBets, setValueBets] = useState<ValueBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterVerdict>('all');
  const [requestsLeft] = useState<string | null>(null);

  const analyse = useCallback(async (sportKey: string) => {
    if (!demoMode && !apiKey) { onNeedKey(); return; }
    setLoading(true);
    setError(null);
    setSelectedSport(sportKey);
    setValueBets([]);
    try {
      let games: OddsGame[];
      if (demoMode) {
        await new Promise(r => setTimeout(r, 600)); // simulate loading
        games = DEMO_GAMES.filter(g => g.sport_key === sportKey || DEMO_SPORT_KEYS.includes(sportKey));
        if (!DEMO_SPORT_KEYS.includes(sportKey)) games = [];
      } else {
        games = await fetchOdds(apiKey, sportKey);
      }
      // update requests remaining from response header via a second call isn't possible here
      // but we parse it from the X-Requests-Remaining header if available

      const results: ValueBet[] = [];
      for (const game of games) {
        const sport = mapSport(game.sport_key);
        const event = `${game.away_team} @ ${game.home_team}`;
        for (const book of game.bookmakers) {
          for (const market of book.markets) {
            const betType = mapBetType(market.key);
            for (const outcome of market.outcomes) {
              const odds = outcome.price;
              if (odds <= 1) continue;
              const rec = analyzeBet(bets, sport, betType, odds, bankroll);
              const selection = outcome.point !== undefined
                ? `${outcome.name} ${outcome.point > 0 ? '+' : ''}${outcome.point}`
                : outcome.name;
              results.push({
                gameId: game.id,
                event,
                sport,
                sportKey: game.sport_key,
                commenceTime: game.commence_time,
                bookmaker: book.title,
                market: market.key,
                betType,
                selection,
                odds,
                breakEven: parseFloat((100 / odds).toFixed(1)),
                historicalWinRate: rec.historicalWinRate,
                historicalBets: rec.historicalBets,
                edge: rec.edge,
                kellyFraction: rec.kellyFraction,
                kellyStake: rec.kellyStake,
                verdict:
                  rec.verdict === 'strong' ? 'strong'
                  : rec.verdict === 'lean' ? 'lean'
                  : rec.verdict === 'avoid' ? 'avoid'
                  : 'no-data',
              });
            }
          }
        }
      }

      // sort: strong first, then lean, then by edge desc
      results.sort((a, b) => {
        const order = { strong: 0, lean: 1, avoid: 3, 'no-data': 2 };
        if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict];
        return (b.edge ?? -99) - (a.edge ?? -99);
      });

      setValueBets(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch odds. Check your API key.');
    } finally {
      setLoading(false);
    }
  }, [apiKey, bets, bankroll, onNeedKey]);

  const displayed = valueBets.filter(b => {
    if (filter === 'strong') return b.verdict === 'strong';
    if (filter === 'lean') return b.verdict === 'strong' || b.verdict === 'lean';
    return true;
  });

  function verdictBadge(verdict: ValueBet['verdict']) {
    const map = {
      strong:  { bg: 'rgba(52,211,153,0.12)', color: 'var(--green)',   label: '✅ BET IT' },
      lean:    { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24',        label: '🟡 LEAN YES' },
      avoid:   { bg: 'rgba(248,113,113,0.1)',  color: 'var(--red)',     label: '🚫 AVOID' },
      'no-data': { bg: 'rgba(79,124,255,0.08)', color: 'var(--accent)', label: '❓ NO DATA' },
    };
    const s = map[verdict];
    return (
      <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {s.label}
      </span>
    );
  }

  const strongCount = valueBets.filter(b => b.verdict === 'strong').length;
  const leanCount = valueBets.filter(b => b.verdict === 'lean').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Demo banner */}
      {demoMode && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '12px 18px', fontSize: 13, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🎭</span>
          <span><strong>Demo mode</strong> — showing sample odds so you can see how this works. To get real live odds, add a free API key in <strong>Settings</strong> (the-odds-api.com, free signup).</span>
        </div>
      )}

      {/* Info banner */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>How this works:</strong> We pull today's odds from multiple bookmakers, then cross-reference every bet against your personal win rate for that sport and bet type. Only bets where <em>your history</em> suggests positive expected value are highlighted.
        {bets.filter(b => b.result !== 'pending' && b.result !== 'void').length < 20 && (
          <span style={{ color: '#fbbf24' }}> — You have fewer than 20 settled bets so most results will show "NO DATA". Keep logging to unlock personalised recommendations.</span>
        )}
      </div>

      {/* Sport selector */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Select a sport to scan</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {POPULAR_SPORTS.map(s => (
            <button
              key={s.key}
              onClick={() => analyse(s.key)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
                background: selectedSport === s.key ? 'var(--accent)' : 'var(--input-bg)',
                color: selectedSport === s.key ? '#fff' : 'var(--text-secondary)',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 14 }}>
          Fetching live odds...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '14px 18px', color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Results header */}
      {valueBets.length > 0 && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--green)', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600 }}>
                {strongCount} strong
              </span>
              <span style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600 }}>
                {leanCount} lean
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, padding: '5px 0' }}>
                from {valueBets.length} bets across {new Set(valueBets.map(b => b.gameId)).size} games
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'lean', 'strong'] as FilterVerdict[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: filter === f ? 'var(--accent)' : 'var(--input-bg)', color: filter === f ? '#fff' : 'var(--text-muted)' }}>
                  {f === 'all' ? 'All' : f === 'lean' ? '+Lean' : 'Strong only'}
                </button>
              ))}
            </div>
          </div>

          {/* Bet cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map((vb, i) => (
              <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{vb.event}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {formatTime(vb.commenceTime)} · {vb.bookmaker}
                    </div>
                  </div>
                  {verdictBadge(vb.verdict)}
                </div>

                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                  {/* Selection */}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                      {vb.betType}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{vb.selection}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                      {vb.odds.toFixed(2)} <span style={{ color: 'var(--text-muted)' }}>({formatOddsAmerican(vb.odds)})</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <MiniStat label="Your win rate" value={vb.historicalWinRate !== null ? `${vb.historicalWinRate}%` : '—'} sub={`${vb.historicalBets} bets`} />
                    <MiniStat label="Break-even" value={`${vb.breakEven}%`} />
                    <MiniStat
                      label="Edge"
                      value={vb.edge !== null ? `${vb.edge > 0 ? '+' : ''}${vb.edge}%` : '—'}
                      positive={vb.edge !== null ? vb.edge > 0 : null}
                    />
                    <MiniStat
                      label="Kelly stake"
                      value={vb.kellyFraction > 0 ? `$${vb.kellyStake}` : '—'}
                      sub={vb.kellyFraction > 0 ? `${vb.kellyFraction}% of bankroll` : undefined}
                      positive={vb.kellyFraction > 0 ? true : null}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {requestsLeft && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
              API requests remaining this month: {requestsLeft}
            </p>
          )}
        </>
      )}

      {valueBets.length === 0 && !loading && !error && selectedSport && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>
          No games found for this sport right now.
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean | null }) {
  const color = positive === true ? 'var(--green)' : positive === false ? 'var(--red)' : 'var(--text-primary)';
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}
