import { useState, useCallback } from 'react';
import type { Bet } from './types';
import { loadBets, saveBets } from './utils/storage';
import Dashboard from './components/Dashboard';
import BetHistory from './components/BetHistory';
import AddBetModal from './components/AddBetModal';
import Analysis from './components/Analysis';
import BetSlip from './components/BetSlip';
import FindBets from './components/FindBets';
import Settings from './components/Settings';
import TodaysGames from './components/TodaysGames';
import { computeStats } from './utils/stats';

type Tab = 'today' | 'dashboard' | 'find' | 'analysis' | 'betslip' | 'history' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'today',     label: '📅 Today' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'find',      label: '🔎 Find Bets' },
  { id: 'analysis',  label: 'My Edge' },
  { id: 'betslip',   label: 'Bet Slip' },
  { id: 'history',   label: 'History' },
  { id: 'settings',  label: 'Settings' },
];

const BANKROLL_KEY = 'betting_bankroll';
const API_KEY_KEY  = 'odds_api_key';

function loadBankroll(): number {
  const v = localStorage.getItem(BANKROLL_KEY);
  return v ? parseFloat(v) : 1000;
}

function loadApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) ?? '';
}

function fmt(n: number) {
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

export default function App() {
  const [bets, setBets] = useState<Bet[]>(() => loadBets());
  const [tab, setTab] = useState<Tab>('today');
  const [showAdd, setShowAdd] = useState(false);
  const [editBet, setEditBet] = useState<Bet | null>(null);
  const [bankroll, setBankroll] = useState<number>(loadBankroll);
  const [apiKey, setApiKey] = useState<string>(loadApiKey);

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

  function handleSettingsSave(newKey: string, newBankroll: number) {
    setApiKey(newKey);
    setBankroll(newBankroll);
    localStorage.setItem(API_KEY_KEY, newKey);
    localStorage.setItem(BANKROLL_KEY, String(newBankroll));
  }

  const stats = computeStats(bets);
  const plPositive = stats.profitLoss >= 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
            <span style={{ fontSize: 20 }}>📈</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>BetTracker</span>
          </div>

          <nav style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: tab === t.id ? 'var(--tab-active-bg)' : 'transparent',
                color: tab === t.id ? 'var(--accent)' : t.id === 'find' ? (tab === t.id ? 'var(--accent)' : 'var(--green)') : 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}>
                {t.label}
              </button>
            ))}
          </nav>

          {bets.length > 0 && (
            <span style={{ marginLeft: 'auto', background: plPositive ? 'var(--badge-win-bg)' : 'var(--badge-loss-bg)', color: plPositive ? 'var(--badge-win)' : 'var(--badge-loss)', padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {fmt(stats.profitLoss)} · {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}% ROI
            </span>
          )}

          <button
            onClick={() => { setEditBet(null); setShowAdd(true); }}
            style={{ marginLeft: bets.length > 0 ? 0 : 'auto', padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + Add Bet
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'today'     && <TodaysGames />}
        {tab === 'dashboard' && <Dashboard bets={bets} />}
        {tab === 'find'      && (
          <FindBets bets={bets} apiKey={apiKey} bankroll={bankroll} onNeedKey={() => setTab('settings')} demoMode={!apiKey} />
        )}
        {tab === 'analysis'  && <Analysis bets={bets} />}
        {tab === 'betslip'   && <BetSlip bets={bets} bankroll={bankroll} onBankrollChange={br => handleSettingsSave(apiKey, br)} />}
        {tab === 'history'   && <BetHistory bets={bets} onEdit={handleEdit} onDelete={handleDelete} />}
        {tab === 'settings'  && <Settings apiKey={apiKey} bankroll={bankroll} onSave={handleSettingsSave} />}
      </main>

      {showAdd && (
        <AddBetModal onSave={handleSave} onClose={() => { setShowAdd(false); setEditBet(null); }} editBet={editBet} />
      )}
    </div>
  );
}

