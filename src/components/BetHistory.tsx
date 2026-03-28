import { useState, useMemo } from 'react';
import type { Bet, BetResult, Sport } from '../types';
import { calcProfitLoss, formatOddsAmerican } from '../utils/stats';

interface BetHistoryProps {
  bets: Bet[];
  onEdit: (bet: Bet) => void;
  onDelete: (id: string) => void;
}

function resultBadge(result: BetResult) {
  const styles: Record<BetResult, { bg: string; color: string; label: string }> = {
    pending: { bg: 'var(--badge-pending-bg)', color: 'var(--badge-pending)', label: 'Pending' },
    win: { bg: 'var(--badge-win-bg)', color: 'var(--badge-win)', label: 'Win' },
    loss: { bg: 'var(--badge-loss-bg)', color: 'var(--badge-loss)', label: 'Loss' },
    void: { bg: 'var(--badge-void-bg)', color: 'var(--badge-void)', label: 'Void' },
    'half-win': { bg: 'var(--badge-win-bg)', color: 'var(--badge-win)', label: 'Half Win' },
    'half-loss': { bg: 'var(--badge-loss-bg)', color: 'var(--badge-loss)', label: 'Half Loss' },
  };
  const s = styles[result];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  );
}

function fmt(n: number) {
  const abs = Math.abs(n).toFixed(2);
  if (n > 0) return <span style={{ color: 'var(--green)' }}>+${abs}</span>;
  if (n < 0) return <span style={{ color: 'var(--red)' }}>-${abs}</span>;
  return <span style={{ color: 'var(--text-muted)' }}>$0.00</span>;
}

type SortKey = 'date' | 'sport' | 'odds' | 'stake' | 'pl';
type SortDir = 'asc' | 'desc';

const ALL = 'all';

export default function BetHistory({ bets, onEdit, onDelete }: BetHistoryProps) {
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState<Sport | typeof ALL>(ALL);
  const [filterResult, setFilterResult] = useState<BetResult | typeof ALL>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sports = useMemo(() => {
    const s = new Set(bets.map((b) => b.sport));
    return Array.from(s).sort();
  }, [bets]);

  const filtered = useMemo(() => {
    let list = [...bets];
    if (filterSport !== ALL) list = list.filter((b) => b.sport === filterSport);
    if (filterResult !== ALL) list = list.filter((b) => b.result === filterResult);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.event.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.sport.toLowerCase().includes(q) ||
          b.notes.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'sport') cmp = a.sport.localeCompare(b.sport);
      else if (sortKey === 'odds') cmp = a.odds - b.odds;
      else if (sortKey === 'stake') cmp = a.stake - b.stake;
      else if (sortKey === 'pl') cmp = calcProfitLoss(a) - calcProfitLoss(b);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [bets, filterSport, filterResult, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button
        onClick={() => toggleSort(col)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: active ? 'var(--accent)' : 'var(--text-muted)',
          fontWeight: 600,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: 0,
        }}
      >
        {label}
        <span style={{ fontSize: 10 }}>
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </button>
    );
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
  };

  if (bets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14 }}>No bets to display. Add your first bet!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bets..."
          style={{
            ...selectStyle,
            flex: '1 1 180px',
            minWidth: 140,
          }}
        />
        <select value={filterSport} onChange={(e) => setFilterSport(e.target.value as Sport | typeof ALL)} style={selectStyle}>
          <option value={ALL}>All Sports</option>
          {sports.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterResult} onChange={(e) => setFilterResult(e.target.value as BetResult | typeof ALL)} style={selectStyle}>
          <option value={ALL}>All Results</option>
          {(['pending', 'win', 'loss', 'void', 'half-win', 'half-loss'] as BetResult[]).map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtered.length} of {bets.length} bets
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left' }}><SortBtn col="date" label="Date" /></th>
              <th style={{ padding: '10px 16px', textAlign: 'left' }}><SortBtn col="sport" label="Sport" /></th>
              <th style={{ padding: '10px 16px', textAlign: 'left', minWidth: 180 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event / Bet</span>
              </th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}><SortBtn col="odds" label="Odds" /></th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}><SortBtn col="stake" label="Stake" /></th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Result</span>
              </th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}><SortBtn col="pl" label="P/L" /></th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bet, i) => {
              const pl = calcProfitLoss(bet);
              return (
                <tr
                  key={bet.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--table-alt-bg)',
                  }}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{bet.date}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {bet.sport.charAt(0).toUpperCase() + bet.sport.slice(1)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{bet.event}</div>
                    {bet.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1)} · {bet.description}
                      </div>
                    )}
                    {bet.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>{bet.notes}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{bet.odds.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatOddsAmerican(bet.odds)}</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    ${bet.stake.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{resultBadge(bet.result)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {bet.result === 'pending' ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                    ) : (
                      fmt(pl)
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => onEdit(bet)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        marginRight: 6,
                      }}
                    >
                      Edit
                    </button>
                    {confirmDelete === bet.id ? (
                      <>
                        <button
                          onClick={() => { onDelete(bet.id); setConfirmDelete(null); }}
                          style={{
                            background: 'var(--red)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            cursor: 'pointer',
                            color: '#fff',
                            marginRight: 4,
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 12,
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(bet.id)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                          color: 'var(--red)',
                        }}
                      >
                        Delete
                      </button>
                    )}
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
