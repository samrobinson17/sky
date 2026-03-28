import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Bet, BetResult, BetType, Sport } from '../types';
import { oddsAmericanToDecimal } from '../utils/stats';

interface AddBetModalProps {
  onSave: (bet: Bet) => void;
  onClose: () => void;
  editBet?: Bet | null;
}

const SPORTS: Sport[] = ['football', 'basketball', 'baseball', 'hockey', 'soccer', 'tennis', 'golf', 'mma', 'boxing', 'other'];
const BET_TYPES: BetType[] = ['moneyline', 'spread', 'over/under', 'parlay', 'prop', 'futures', 'other'];
const RESULTS: BetResult[] = ['pending', 'win', 'loss', 'void', 'half-win', 'half-loss'];

type OddsFormat = 'decimal' | 'american';

function labelOf(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  display: 'block',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

export default function AddBetModal({ onSave, onClose, editBet }: AddBetModalProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(editBet?.date ?? today);
  const [sport, setSport] = useState<Sport>(editBet?.sport ?? 'football');
  const [event, setEvent] = useState(editBet?.event ?? '');
  const [betType, setBetType] = useState<BetType>(editBet?.betType ?? 'moneyline');
  const [description, setDescription] = useState(editBet?.description ?? '');
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('decimal');
  const [oddsInput, setOddsInput] = useState(
    editBet ? String(editBet.odds) : ''
  );
  const [stake, setStake] = useState(editBet ? String(editBet.stake) : '');
  const [result, setResult] = useState<BetResult>(editBet?.result ?? 'pending');
  const [notes, setNotes] = useState(editBet?.notes ?? '');
  const [error, setError] = useState('');

  function getDecimalOdds(): number | null {
    const v = parseFloat(oddsInput);
    if (isNaN(v)) return null;
    if (oddsFormat === 'american') return oddsAmericanToDecimal(v);
    return v;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const decimalOdds = getDecimalOdds();
    const stakeNum = parseFloat(stake);

    if (!event.trim()) { setError('Event is required.'); return; }
    if (decimalOdds === null || decimalOdds <= 1) { setError('Odds must be greater than 1.00.'); return; }
    if (isNaN(stakeNum) || stakeNum <= 0) { setError('Stake must be a positive number.'); return; }

    setError('');
    onSave({
      id: editBet?.id ?? uuidv4(),
      date,
      sport,
      event: event.trim(),
      betType,
      description: description.trim(),
      odds: parseFloat(decimalOdds.toFixed(4)),
      stake: parseFloat(stakeNum.toFixed(2)),
      result,
      notes: notes.trim(),
    });
  }

  const potentialWin = (() => {
    const odds = getDecimalOdds();
    const s = parseFloat(stake);
    if (odds && !isNaN(s) && s > 0) return ((odds - 1) * s).toFixed(2);
    return null;
  })();

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {editBet ? 'Edit Bet' : 'Add New Bet'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row: date + sport */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} required />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Sport</label>
              <select value={sport} onChange={(e) => setSport(e.target.value as Sport)} style={inputStyle}>
                {SPORTS.map((s) => <option key={s} value={s}>{labelOf(s)}</option>)}
              </select>
            </div>
          </div>

          {/* Event */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Event / Match</label>
            <input
              type="text"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. Chiefs vs Eagles"
              style={inputStyle}
            />
          </div>

          {/* Bet type + description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Bet Type</label>
              <select value={betType} onChange={(e) => setBetType(e.target.value as BetType)} style={inputStyle}>
                {BET_TYPES.map((t) => <option key={t} value={t}>{labelOf(t)}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Selection / Line</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Chiefs -3.5"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Odds */}
          <div style={fieldStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Odds</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['decimal', 'american'] as OddsFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOddsFormat(f)}
                    style={{
                      padding: '3px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: oddsFormat === f ? 'var(--accent)' : 'var(--input-bg)',
                      color: oddsFormat === f ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={oddsInput}
              onChange={(e) => setOddsInput(e.target.value)}
              placeholder={oddsFormat === 'decimal' ? 'e.g. 1.91' : 'e.g. -110 or +200'}
              step="any"
              style={inputStyle}
            />
          </div>

          {/* Stake */}
          <div style={fieldStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Stake ($)</label>
              {potentialWin && (
                <span style={{ fontSize: 12, color: 'var(--green)' }}>
                  Potential win: ${potentialWin}
                </span>
              )}
            </div>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="e.g. 50"
              step="0.01"
              min="0.01"
              style={inputStyle}
            />
          </div>

          {/* Result */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Result</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RESULTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResult(r)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    background:
                      result === r
                        ? r === 'win' || r === 'half-win'
                          ? 'var(--green)'
                          : r === 'loss' || r === 'half-loss'
                          ? 'var(--red)'
                          : r === 'pending'
                          ? 'var(--accent)'
                          : 'var(--text-muted)'
                        : 'var(--input-bg)',
                    color: result === r ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {labelOf(r)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this bet..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text-secondary)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {editBet ? 'Save Changes' : 'Add Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
