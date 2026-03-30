import { useState, useMemo } from 'react';
import type { Debt, Strategy } from '../types';
import { calculatePayoff, getPayoffOrder } from '../utils/payoff';

const CATEGORY_ICONS: Record<string, string> = {
  'credit-card': '💳',
  'student-loan': '🎓',
  'auto': '🚗',
  'personal': '💰',
  'medical': '🏥',
  'other': '📋',
};

interface Props {
  debts: Debt[];
  extraMonthly: number;
  onExtraChange: (v: number) => void;
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtExact(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayoffPlan({ debts, extraMonthly, onExtraChange }: Props) {
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleRows, setScheduleRows] = useState(24);
  const [extraInput, setExtraInput] = useState(String(extraMonthly));

  const avalanche = useMemo(() => calculatePayoff(debts, extraMonthly, 'avalanche'), [debts, extraMonthly]);
  const snowball = useMemo(() => calculatePayoff(debts, extraMonthly, 'snowball'), [debts, extraMonthly]);
  const minimumsOnly = useMemo(() => calculatePayoff(debts, 0, 'avalanche'), [debts]);

  const active = strategy === 'avalanche' ? avalanche : snowball;
  const payoffOrder = useMemo(() => getPayoffOrder(debts, extraMonthly, strategy), [debts, extraMonthly, strategy]);

  if (debts.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '64px 24px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
          No debts added yet
        </div>
        <div style={{ fontSize: 14 }}>Add your debts in the "My Debts" tab to see your payoff plan.</div>
      </div>
    );
  }

  const interestSaved = minimumsOnly.totalInterestPaid - active.totalInterestPaid;
  const monthsSaved = minimumsOnly.monthsToPayoff - active.monthsToPayoff;

  function handleExtraBlur() {
    const v = parseFloat(extraInput);
    if (!isNaN(v) && v >= 0) {
      onExtraChange(+v.toFixed(2));
      setExtraInput(String(+v.toFixed(2)));
    } else {
      setExtraInput(String(extraMonthly));
    }
  }

  const scheduleVisible = active.months.slice(0, scheduleRows);
  const debtMap = Object.fromEntries(debts.map(d => [d.id, d]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Extra payment input */}
      <div style={{
        background: 'var(--card-bg)', borderRadius: 14, padding: 22,
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Extra Monthly Payment</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Amount above your minimums you can put toward debt each month
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 18, fontWeight: 600 }}>$</span>
          <input
            type="number"
            min="0"
            step="50"
            value={extraInput}
            onChange={e => setExtraInput(e.target.value)}
            onBlur={handleExtraBlur}
            style={{
              background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
              fontSize: 20, fontWeight: 700, width: 130, outline: 'none',
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/mo</span>
        </div>
        {interestSaved > 0 && (
          <div style={{
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 8, padding: '8px 14px', fontSize: 13,
          }}>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>
              Saves {fmt(interestSaved)} interest · {monthsSaved} mo faster
            </span>
          </div>
        )}
      </div>

      {/* Strategy comparison */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Strategy Comparison
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {(['avalanche', 'snowball'] as Strategy[]).map(s => {
            const plan = s === 'avalanche' ? avalanche : snowball;
            const isActive = strategy === s;
            const isRecommended = s === 'avalanche' && avalanche.totalInterestPaid <= snowball.totalInterestPaid;
            return (
              <div
                key={s}
                onClick={() => setStrategy(s)}
                style={{
                  background: isActive ? 'var(--accent-bg)' : 'var(--card-bg)',
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 14, padding: 20, cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>
                      {s}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {s === 'avalanche' ? 'Highest APR first' : 'Lowest balance first'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    {isRecommended && (
                      <span style={{
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 20, letterSpacing: '0.05em',
                      }}>SAVES MOST</span>
                    )}
                    {isActive && (
                      <span style={{
                        background: 'rgba(79,124,255,0.15)', color: 'var(--accent)',
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 20, letterSpacing: '0.05em',
                      }}>SELECTED</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>TOTAL INTEREST</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{fmt(plan.totalInterestPaid)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>MONTHS TO PAY OFF</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{plan.monthsToPayoff}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>TOTAL PAID</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(plan.totalPaid)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>DEBT-FREE DATE</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>{plan.payoffDate}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payoff order */}
      {payoffOrder.length > 0 && (
        <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payoff Order — {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payoffOrder.map((item, i) => {
              const debt = debtMap[item.debtId];
              if (!debt) return null;
              return (
                <div key={item.debtId} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 14px', borderRadius: 10,
                  background: i === 0 ? 'rgba(79,124,255,0.07)' : 'var(--input-bg)',
                  border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'transparent'}`,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: i === 0 ? 'var(--accent)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    color: i === 0 ? '#fff' : 'var(--text-secondary)',
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[debt.category] ?? '📋'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{debt.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      {debt.apr}% APR · {fmtExact(debt.balance)} balance
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                      {item.paidOffDate}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      Month {item.paidOffMonth}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly schedule */}
      <div style={{ background: 'var(--card-bg)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div
          onClick={() => setShowSchedule(v => !v)}
          style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Month-by-Month Schedule
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 18, transform: showSchedule ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
            ▾
          </span>
        </div>

        {showSchedule && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interest</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Principal</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleVisible.map((m, i) => {
                    const principal = +(m.totalPaid - m.totalInterest).toFixed(2);
                    const isPayoffMonth = m.totalRemaining < 0.01;
                    return (
                      <tr
                        key={m.month}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isPayoffMonth
                            ? 'rgba(52,211,153,0.06)'
                            : i % 2 === 1 ? 'var(--table-alt-bg)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: 8, fontSize: 11 }}>#{m.month}</span>
                          {m.date}
                          {isPayoffMonth && (
                            <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>DEBT FREE!</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500 }}>{fmtExact(m.totalPaid)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--red)' }}>{fmtExact(m.totalInterest)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--green)' }}>{fmtExact(principal)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>
                          {m.totalRemaining < 0.01 ? '—' : fmtExact(m.totalRemaining)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {active.months.length > scheduleRows && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button
                  onClick={() => setScheduleRows(v => v + 24)}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 20px', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Show {Math.min(24, active.months.length - scheduleRows)} more months
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
