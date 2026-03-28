import { useState, useCallback } from 'react';
import type { Bet } from './types';
import { loadBets, saveBets } from './utils/storage';
import Dashboard from './components/Dashboard';
import BetHistory from './components/BetHistory';
import AddBetModal from './components/AddBetModal';
import { computeStats } from './utils/stats';

type Tab = 'dashboard' | 'history';

function fmt(n: number) {
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

export default function App() {
  const [bets, setBets] = useState<Bet[]>(() => loadBets());
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showAdd, setShowAdd] = useState(false);
  const [editBet, setEditBet] = useState<Bet | null>(null);

  const persist = useCallback((updated: Bet[]) => {
    setBets(updated);
    saveBets(updated);
  }, []);

  function handleSave(bet: Bet) {
    const exists = bets.findIndex((b) => b.id === bet.id);
    const updated =
      exists >= 0
        ? bets.map((b) => (b.id === bet.id ? bet : b))
        : [...bets, bet];
    persist(updated);
    setShowAdd(false);
    setEditBet(null);
  }

  function handleDelete(id: string) {
    persist(bets.filter((b) => b.id !== id));
  }

  function handleEdit(bet: Bet) {
    setEditBet(bet);
    setShowAdd(true);
  }

  const stats = computeStats(bets);
  const plPositive = stats.profitLoss >= 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
            <span style={{ fontSize: 22 }}>📈</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>BetTracker</span>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {(['dashboard', 'history'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  background: tab === t ? 'var(--tab-active-bg)' : 'transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>

          {/* P/L pill */}
          {bets.length > 0 && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  background: plPositive ? 'var(--badge-win-bg)' : 'var(--badge-loss-bg)',
                  color: plPositive ? 'var(--badge-win)' : 'var(--badge-loss)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {fmt(stats.profitLoss)} · {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}% ROI
              </span>
            </div>
          )}

          <button
            onClick={() => { setEditBet(null); setShowAdd(true); }}
            style={{
              marginLeft: bets.length > 0 ? 0 : 'auto',
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Add Bet
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'dashboard' && <Dashboard bets={bets} />}
        {tab === 'history' && (
          <BetHistory bets={bets} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </main>

      {/* Modal */}
      {showAdd && (
        <AddBetModal
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditBet(null); }}
          editBet={editBet}
        />
      )}
    </div>
  );
}
