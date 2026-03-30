import type { Debt, Strategy, PayoffResult } from '../types';

const BASE_YEAR = 2026;
const BASE_MONTH = 2; // March (0-indexed)

function getMonthLabel(offset: number): string {
  const d = new Date(BASE_YEAR, BASE_MONTH + offset, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function calculatePayoff(
  debts: Debt[],
  extraMonthly: number,
  strategy: Strategy
): PayoffResult {
  if (debts.length === 0) {
    return {
      strategy,
      months: [],
      totalInterestPaid: 0,
      totalPaid: 0,
      payoffDate: 'N/A',
      monthsToPayoff: 0,
    };
  }

  const totalBudget = debts.reduce((s, d) => s + d.minPayment, 0) + extraMonthly;
  const working = debts.map(d => ({ ...d, balance: d.balance }));
  const months = [];
  let totalInterestPaid = 0;
  let month = 0;

  while (working.some(d => d.balance > 0.01) && month < 600) {
    month++;

    const active = working.filter(d => d.balance > 0.01);
    const prioritized = [...active].sort((a, b) =>
      strategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance
    );

    // Accrue interest
    const interestMap: Record<string, number> = {};
    let monthInterest = 0;
    for (const d of active) {
      const interest = +(d.balance * d.apr / 100 / 12).toFixed(2);
      d.balance = +(d.balance + interest).toFixed(2);
      interestMap[d.id] = interest;
      monthInterest = +(monthInterest + interest).toFixed(2);
    }
    totalInterestPaid = +(totalInterestPaid + monthInterest).toFixed(2);

    const payments = active.map(d => ({
      debtId: d.id,
      principal: 0,
      interest: interestMap[d.id],
      remaining: d.balance,
    }));

    // Apply minimums
    let remainingBudget = totalBudget;
    for (const d of active) {
      const pay = +Math.min(d.minPayment, d.balance).toFixed(2);
      d.balance = +(d.balance - pay).toFixed(2);
      remainingBudget = +(remainingBudget - pay).toFixed(2);
      const p = payments.find(mp => mp.debtId === d.id)!;
      p.principal = +(p.principal + pay).toFixed(2);
      p.remaining = d.balance;
    }

    // Apply extra to priority debts in order
    for (const d of prioritized) {
      if (remainingBudget < 0.01) break;
      if (d.balance < 0.01) continue;
      const pay = +Math.min(remainingBudget, d.balance).toFixed(2);
      d.balance = +(d.balance - pay).toFixed(2);
      remainingBudget = +(remainingBudget - pay).toFixed(2);
      const p = payments.find(mp => mp.debtId === d.id)!;
      p.principal = +(p.principal + pay).toFixed(2);
      p.remaining = d.balance;
    }

    const totalRemaining = +working.reduce((s, d) => s + d.balance, 0).toFixed(2);
    const totalPaid = +(totalBudget - remainingBudget).toFixed(2);

    months.push({
      month,
      date: getMonthLabel(month),
      payments,
      totalPaid,
      totalInterest: monthInterest,
      totalRemaining,
    });
  }

  return {
    strategy,
    months,
    totalInterestPaid,
    totalPaid: +months.reduce((s, m) => s + m.totalPaid, 0).toFixed(2),
    payoffDate: months[months.length - 1]?.date ?? 'N/A',
    monthsToPayoff: months.length,
  };
}

export function getPayoffOrder(
  debts: Debt[],
  extraMonthly: number,
  strategy: Strategy
): { debtId: string; name: string; paidOffMonth: number; paidOffDate: string }[] {
  const result = calculatePayoff(debts, extraMonthly, strategy);
  const order: { debtId: string; name: string; paidOffMonth: number; paidOffDate: string }[] = [];
  const seen = new Set<string>();

  for (const m of result.months) {
    for (const p of m.payments) {
      if (!seen.has(p.debtId) && p.remaining < 0.01) {
        seen.add(p.debtId);
        const debt = debts.find(d => d.id === p.debtId);
        if (debt) {
          order.push({
            debtId: p.debtId,
            name: debt.name,
            paidOffMonth: m.month,
            paidOffDate: m.date,
          });
        }
      }
    }
  }

  return order;
}
