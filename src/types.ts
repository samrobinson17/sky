export type BetResult = 'pending' | 'win' | 'loss' | 'void' | 'half-win' | 'half-loss';

export type BetType =
  | 'moneyline'
  | 'spread'
  | 'over/under'
  | 'parlay'
  | 'prop'
  | 'futures'
  | 'other';

export type Sport =
  | 'football'
  | 'basketball'
  | 'baseball'
  | 'hockey'
  | 'soccer'
  | 'tennis'
  | 'golf'
  | 'mma'
  | 'boxing'
  | 'other';

export interface Bet {
  id: string;
  date: string;
  sport: Sport;
  event: string;
  betType: BetType;
  description: string;
  odds: number; // decimal odds (e.g. 1.91, 2.50)
  stake: number;
  result: BetResult;
  notes: string;
}

export interface Stats {
  totalBets: number;
  settledBets: number;
  wins: number;
  losses: number;
  voids: number;
  winRate: number;
  totalStaked: number;
  totalReturns: number;
  profitLoss: number;
  roi: number;
  avgOdds: number;
  avgStake: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
}
