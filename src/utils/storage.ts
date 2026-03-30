import type { Debt } from '../types';

const DEBTS_KEY = 'sky_debts_v1';
const EXTRA_KEY = 'sky_extra_v1';

export function loadDebts(): Debt[] {
  try {
    const raw = localStorage.getItem(DEBTS_KEY);
    return raw ? (JSON.parse(raw) as Debt[]) : [];
  } catch {
    return [];
  }
}

export function saveDebts(debts: Debt[]): void {
  localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
}

export function loadExtra(): number {
  try {
    const raw = localStorage.getItem(EXTRA_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function saveExtra(amount: number): void {
  localStorage.setItem(EXTRA_KEY, String(amount));
}
