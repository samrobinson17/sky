import { useState, useCallback } from 'react';
import type { Debt, DebtCategory } from './types';
import { loadDebts, saveDebts, loadExtra, saveExtra } from './utils/storage';
import AddDebtModal from './components/AddDebtModal';
import PayoffPlan from './components/PayoffPlan';

type Tab = 'overview' | 'debts' | 'plan';

const CATEGORY_ICONS: Record<DebtCategory, string> = {
  'credit-card': '💳',
  'student-loan': '🎓',
  'auto': '🚗',
  'personal': '💰',
  'medical': '🏥',
  'other': '📋',
};

const CATEGORY_LABELS: Record<DebtCategory, string> = {
  'credit-card': 'Credit Card',
  'student-loan': 'Student Loan',
  'auto': 'Auto Loan',
  'personal': 'Personal Loan',
  'medical': 'Medical',
  'other': 'Other',
};

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtExact(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--card-bg)', borderRadius: 12, padding: '18px 20px',
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const [debts, setDebts] = useState<Debt[]>(() => loadDebts());
  const [extraMonthly, setExtraMonthly] = useState(() => loadExtra());
  const [tab, setTab] = useState<Tab>('overview');
  const [showModal, setShowModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const persist = useCallback((updated: Debt[]) => {
    setDebts(updated);
    saveDebts(updated);
  }, []);

  function handleSave(debt: Debt) {
    const idx = debts.findIndex(d => d.id === debt.id);
    const updated = idx >= 0
      ? debts.map(d => d.id === debt.id ? debt : d)
      : [...debts, debt];
    persist(updated);
    setShowModal(false);
    setEditDebt(null);
  }

  function handleDelete(id: string) {
    persist(debts.filter(d => d.id !== id));
    setConfirmDelete(null);
  }

  function handleEdit(debt: Debt) {
    setEditDebt(debt);
    setShowModal(true);
  }

  function handleExtraChange(v: number) {
    setExtraMonthly(v);
    saveExtra(v);
  }

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  const avgApr = debts.length > 0
    ? debts.reduce((s, d) => s + d.apr, 0) / debts.length
    : 0;

  const sortedByApr = [...debts].sort((a, b) => b.apr - a.apr);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 4 }}>
            <span style={{ fontSize: 22 }}>💸</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>DebtFree</span>
          </div>

          <nav style={{ display: 'flex', gap: 4 }}>
            {(['overview', 'debts', 'plan'] as Tab[]).map(t => {
              const labels: Record<Tab, string> = { overview: 'Overview', debts: 'My Debts', plan: 'Payoff Plan' };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500,
                    background: tab === t ? 'var(--tab-active-bg)' : 'transparent',
                    color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {labels[t]}
                </button>
              );
            })}
          </nav>

          {totalDebt > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                background: 'rgba(248,113,113,0.1)', color: 'var(--red)',
                padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              }}>
                {fmt(totalDebt)} total debt
              </span>
            </div>
          )}

          <button
            onClick={() => { setEditDebt(null); setShowModal(true); setTab('debts'); }}
            style={{
              marginLeft: totalDebt > 0 ? 0 : 'auto',
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            + Add Debt
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {debts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>💸</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, margin: '0 0 10px' }}>Take control of your debt</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 420, margin: '0 auto 28px' }}>
                  Add your debts to get a personalized payoff plan using the Avalanche or Snowball method.
                </p>
                <button
                  onClick={() => { setEditDebt(null); setShowModal(true); }}
                  style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Add Your First Debt
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  <StatCard label="Total Debt" value={fmt(totalDebt)} sub={`${debts.length} account${debts.length !== 1 ? 's' : ''}`} color="var(--red)" />
                  <StatCard label="Monthly Minimums" value={fmt(totalMin)} sub="Required payments" />
                  <StatCard label="Average APR" value={`${avgApr.toFixed(2)}%`} sub="Across all debts" />
                  <StatCard
                    label="Monthly + Extra"
                    value={fmt(totalMin + extraMonthly)}
                    sub={extraMonthly > 0 ? `+${fmt(extraMonthly)} extra` : 'Set extra in Payoff Plan'}
                  />
                </div>

                <div style={{ background: 'var(--card-bg)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Debt Breakdown
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>sorted by APR</div>
                  </div>
                  <div>
                    {sortedByApr.map((debt, i) => {
                      const pct = totalDebt > 0 ? (debt.balance / totalDebt) * 100 : 0;
                      return (
                        <div
                          key={debt.id}
                          style={{
                            padding: '14px 20px',
                            borderBottom: i < sortedByApr.length - 1 ? '1px solid var(--border)' : 'none',
                            background: i % 2 === 1 ? 'var(--table-alt-bg)' : 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[debt.category]}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{debt.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                                {CATEGORY_LABELS[debt.category]} · Min {fmtExact(debt.minPayment)}/mo
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtExact(debt.balance)}</div>
                              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 1 }}>{debt.apr}% APR</div>
                            </div>
                          </div>
                          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: `hsl(${220 - i * 25}, 70%, 55%)`,
                              borderRadius: 2,
                            }} />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            {pct.toFixed(1)}% of total debt
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Ready to make a plan?</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Set your extra monthly budget and compare Avalanche vs Snowball strategies.
                    </div>
                  </div>
                  <button
                    onClick={() => setTab('plan')}
                    style={{
                      padding: '9px 20px', borderRadius: 8, border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    View Payoff Plan →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* MY DEBTS TAB */}
        {tab === 'debts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>My Debts</h2>
                {debts.length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {debts.length} debt{debts.length !== 1 ? 's' : ''} · {fmtExact(totalDebt)} total
                  </div>
                )}
              </div>
              <button
                onClick={() => { setEditDebt(null); setShowModal(true); }}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                + Add Debt
              </button>
            </div>

            {debts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>No debts added yet</div>
                <div style={{ fontSize: 14, marginBottom: 24 }}>Add your debts to get started with your payoff plan.</div>
                <button
                  onClick={() => { setEditDebt(null); setShowModal(true); }}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Add First Debt
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {debts.map(debt => (
                  <div
                    key={debt.id}
                    style={{
                      background: 'var(--card-bg)', borderRadius: 12,
                      border: '1px solid var(--border)', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{CATEGORY_ICONS[debt.category]}</span>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{debt.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{CATEGORY_LABELS[debt.category]}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>BALANCE</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtExact(debt.balance)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>APR</div>
                        <div style={{
                          fontSize: 16, fontWeight: 700,
                          color: debt.apr > 15 ? 'var(--red)' : debt.apr > 8 ? '#f59e0b' : 'var(--green)',
                        }}>
                          {debt.apr}%
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>MIN/MO</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtExact(debt.minPayment)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(debt)}
                        style={{
                          padding: '7px 14px', borderRadius: 7,
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                        }}
                      >
                        Edit
                      </button>
                      {confirmDelete === debt.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(debt.id)}
                            style={{
                              padding: '7px 14px', borderRadius: 7, border: 'none',
                              background: 'var(--red)', color: '#fff',
                              cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            style={{
                              padding: '7px 10px', borderRadius: 7,
                              border: '1px solid var(--border)', background: 'transparent',
                              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
                            }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(debt.id)}
                          style={{
                            padding: '7px 14px', borderRadius: 7,
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--red)', cursor: 'pointer', fontSize: 13,
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAYOFF PLAN TAB */}
        {tab === 'plan' && (
          <PayoffPlan
            debts={debts}
            extraMonthly={extraMonthly}
            onExtraChange={handleExtraChange}
          />
        )}
      </main>

      {showModal && (
        <AddDebtModal
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditDebt(null); }}
          editDebt={editDebt}
        />
      )}
    </div>
  );
}
