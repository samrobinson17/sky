import type { Bet } from '../types';

const STORAGE_KEY = 'betting_analysis_bets';

export function loadBets(): Bet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Bet[]) : [];
  } catch {
    return [];
  }
}

export function saveBets(bets: Bet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
}
