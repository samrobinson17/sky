import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Bet, BetType, Sport } from '../types';
import { analyzeBet, oddsAmericanToDecimal, formatOddsAmerican } from '../utils/stats';

interface ProposedBet {
  id: string;
  sport: Sport;
  betType: BetType;
  event: string;
  odds: number;
}

interface BetSlipProps {
  bets: Bet[];
  bankroll: number;
  onBankrollChange: (n: number) => void;
}

const SPORTS: Sport[] = ['football','basketball','baseball','hockey','soccer','tennis','golf','mma','boxing','other'];
const BET_TYPES: BetType[] = ['moneyline','spread','over/under','parlay','prop','futures','other'];

function lbl(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

type OddsFormat = 'decimal' | 'american';

const inputStyle: React.CSSProperties = {
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 11px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default function BetSlip({ bets, bankroll, onBankrollChange }: BetSlipProps) {
  const [proposed, setProposed] = useState<ProposedBet[]>([]);
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('decimal');

  // form state for adding a new proposed bet
  const [sport, setSport] = useState<Sport>('football');
  const [betType, setBetType] = useState<BetType>('moneyline');
  const [event, setEvent] = useState('');
  const [oddsInput, setOddsInput] = useState('');
  const [bankrollInput, setBankrollInput] = useState(String(bankroll));

  const parsedOdds = (() => {
    const v = parseFloat(oddsInput);
    if (isNaN(v)) return null;
    const dec = oddsFormat === 'american' ? oddsAmericanToDecimal(v) : v;
    return dec > 1 ? dec : null;
  })();

  function getOdds(): number | null { return parsedOdds; }

  function addBet() {
    const odds = getOdds();
    if (!odds || odds <= 1) return;
    setProposed(prev => [...prev, { id: uuidv4(), sport, betType, event: event.trim() || `${lbl(sport)} – ${lbl(betType)}`, odds }]);
    setEvent('');
    setOddsInput('');
  }

  function removeBet(id: string) {
    setProposed(prev => prev.filter(b => b.id !== id));
  }

  function verdictStyle(verdict: string): React.CSSProperties {
    if (verdict === 'strong') return { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: 'var(--green)' };
    if (verdict === 'lean') return { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' };
    if (verdict === 'avoid') return { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' };
    return { background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.25)', color: 'var(--accent)' };
  }

  function verdictLabel(verdict: string) {
    if (verdict === 'strong') return '✅ BET IT';
    if (verdict === 'lean') return '🟡 LEAN YES';
    if (verdict === 'avoid') return '🚫 AVOID';
    return '❓ NOT ENOUGH DATA';
  }

  const br = parseFloat(bankrollInput) || bankroll;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Bankroll */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Current Bankroll ($)</div>
          <input
            type="number"
            value={bankrollInput}
            onChange={e => { setBankrollInput(e.target.value); onBankrollChange(parseFloat(e.target.value) || 0); }}
            style={{ ...inputStyle, width: 140 }}
            placeholder="e.g. 1000"
          />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', flex: 1, minWidth: 200 }}>
          Kelly stakes below are calculated as a fraction of this bankroll. Keep it accurate for best results.
        </p>
      </div>

      {/* Add proposed bet */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Add Today's Bet to Analyse
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Event</div>
            <input value={event} onChange={e => setEvent(e.target.value)} placeholder="e.g. Chiefs vs Eagles" style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Sport</div>
            <select value={sport} onChange={e => setSport(e.target.value as Sport)} style={inputStyle}>
              {SPORTS.map(s => <option key={s} value={s}>{lbl(s)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Bet Type</div>
            <select value={betType} onChange={e => setBetType(e.target.value as BetType)} style={inputStyle}>
              {BET_TYPES.map(t => <option key={t} value={t}>{lbl(t)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Odds</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {(['decimal', 'american'] as OddsFormat[]).map(f => (
                  <button key={f} type="button" onClick={() => setOddsFormat(f)} style={{ padding: '1px 7px', fontSize: 10, borderRadius: 4, border: '1px solid var(--border)', cursor: 'pointer', background: oddsFormat === f ? 'var(--accent)' : 'var(--input-bg)', color: oddsFormat === f ? '#fff' : 'var(--text-muted)', fontWeight: 500 }}>
                    {f === 'decimal' ? 'Dec' : 'US'}
                  </button>
                ))}
              </div>
            </div>
            <input value={oddsInput} onChange={e => setOddsInput(e.target.value)} placeholder={oddsFormat === 'decimal' ? '2.00' : '-110'} type="number" step="any" style={inputStyle} />
          </div>
        </div>
        <button
          onClick={addBet}
          disabled={!parsedOdds}
          style={{ marginTop: 14, padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !parsedOdds ? 0.5 : 1 }}
        >
          Analyse Bet
        </button>
      </div>

      {/* Results */}
      {proposed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          Add a bet above to get a recommendation based on your historical data.
        </div>
      )}

      {proposed.map(p => {
        const rec = analyzeBet(bets, p.sport, p.betType, p.odds, br);
        const vs = verdictStyle(rec.verdict);
        return (
          <div key={p.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>{p.event}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {lbl(p.sport)} · {lbl(p.betType)} · {p.odds.toFixed(2)} ({formatOddsAmerican(p.odds)})
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ ...vs, borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 13 }}>
                  {verdictLabel(rec.verdict)}
                </span>
                <button onClick={() => removeBet(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
              <Stat label="Your Win Rate" value={rec.historicalWinRate !== null ? `${rec.historicalWinRate}%` : '—'} sub={`from ${rec.historicalBets} bets`} />
              <Stat label="Break-Even Rate" value={`${rec.breakEven}%`} sub="needed to profit" />
              <Stat label="Your Edge" value={rec.edge !== null ? `${rec.edge > 0 ? '+' : ''}${rec.edge}%` : '—'} positive={rec.edge !== null ? rec.edge > 0 : null} />
              <Stat label="Kelly Stake" value={rec.kellyFraction > 0 ? `$${rec.kellyStake}` : '$0'} sub={rec.kellyFraction > 0 ? `${rec.kellyFraction}% of bankroll` : 'No bet'} positive={rec.kellyFraction > 0 ? true : null} />
            </div>

            {/* Reason */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--table-alt-bg)' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.reason}</p>
            </div>
          </div>
        );
      })}

      {/* Disclaimer */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
        Recommendations are based solely on your personal betting history and Kelly Criterion math.
        Past performance does not guarantee future results. Bet responsibly.
      </p>
    </div>
  );
}

function Stat({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean | null }) {
  const color = positive === true ? 'var(--green)' : positive === false ? 'var(--red)' : 'var(--text-primary)';
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
