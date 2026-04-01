import type { Bet, Stats } from '../types';

export function calcProfitLoss(bet: Bet): number {
  if (bet.result === 'void') return 0;
  if (bet.result === 'pending') return 0;
  if (bet.result === 'win') return bet.stake * (bet.odds - 1);
  if (bet.result === 'half-win') return (bet.stake / 2) * (bet.odds - 1);
  if (bet.result === 'half-loss') return -(bet.stake / 2);
  // loss
  return -bet.stake;
}

export function computeStats(bets: Bet[]): Stats {
  const settled = bets.filter(
    (b) => b.result !== 'pending' && b.result !== 'void'
  );
  const wins = settled.filter(
    (b) => b.result === 'win' || b.result === 'half-win'
  );
  const losses = settled.filter(
    (b) => b.result === 'loss' || b.result === 'half-loss'
  );
  const voids = bets.filter((b) => b.result === 'void');

  const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
  const profitLoss = settled.reduce((sum, b) => sum + calcProfitLoss(b), 0);
  const totalReturns = totalStaked + profitLoss;
  const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
  const winRate = settled.length > 0 ? (wins.length / settled.length) * 100 : 0;

  const avgOdds =
    settled.length > 0
      ? settled.reduce((sum, b) => sum + b.odds, 0) / settled.length
      : 0;

  const avgStake =
    settled.length > 0
      ? settled.reduce((sum, b) => sum + b.stake, 0) / settled.length
      : 0;

  const pls = settled.map((b) => calcProfitLoss(b));
  const biggestWin = pls.length > 0 ? Math.max(...pls, 0) : 0;
  const biggestLoss = pls.length > 0 ? Math.min(...pls, 0) : 0;

  // streak: look at settled bets sorted by date newest-first
  const sorted = [...settled].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let streakType: Stats['streakType'] = 'none';
  if (sorted.length > 0) {
    const first = sorted[0];
    streakType =
      first.result === 'win' || first.result === 'half-win' ? 'win' : 'loss';
    for (const b of sorted) {
      const isWin = b.result === 'win' || b.result === 'half-win';
      if (
        (streakType === 'win' && isWin) ||
        (streakType === 'loss' && !isWin)
      ) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    totalBets: bets.length,
    settledBets: settled.length,
    wins: wins.length,
    losses: losses.length,
    voids: voids.length,
    winRate,
    totalStaked,
    totalReturns,
    profitLoss,
    roi,
    avgOdds,
    avgStake,
    biggestWin,
    biggestLoss,
    currentStreak,
    streakType,
  };
}

export function oddsAmericanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

export function oddsDecimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

export function formatOddsAmerican(decimal: number): string {
  const am = oddsDecimalToAmerican(decimal);
  return am >= 0 ? `+${am}` : `${am}`;
}

export function getProfitLossByDate(
  bets: Bet[]
): { date: string; cumulative: number }[] {
  const settled = bets
    .filter((b) => b.result !== 'pending' && b.result !== 'void')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulative = 0;
  return settled.map((b) => {
    cumulative += calcProfitLoss(b);
    return { date: b.date, cumulative: parseFloat(cumulative.toFixed(2)) };
  });
}

export function getStatsBySport(
  bets: Bet[]
): { sport: string; bets: number; profitLoss: number; roi: number }[] {
  const map = new Map<
    string,
    { bets: number; stake: number; profitLoss: number }
  >();

  for (const bet of bets) {
    if (bet.result === 'pending' || bet.result === 'void') continue;
    const cur = map.get(bet.sport) ?? { bets: 0, stake: 0, profitLoss: 0 };
    cur.bets++;
    cur.stake += bet.stake;
    cur.profitLoss += calcProfitLoss(bet);
    map.set(bet.sport, cur);
  }

  return Array.from(map.entries()).map(([sport, d]) => ({
    sport: sport.charAt(0).toUpperCase() + sport.slice(1),
    bets: d.bets,
    profitLoss: parseFloat(d.profitLoss.toFixed(2)),
    roi: d.stake > 0 ? parseFloat(((d.profitLoss / d.stake) * 100).toFixed(1)) : 0,
  }));
}

export interface EdgeRow {
  label: string;
  bets: number;
  wins: number;
  winRate: number;        // actual win %
  breakEven: number;      // win % needed to break even at avg odds
  edge: number;           // winRate - breakEven (positive = +EV)
  avgOdds: number;
  roi: number;
  profitLoss: number;
  reliable: boolean;      // true if ≥10 settled bets
}

function buildEdgeRows(
  bets: Bet[],
  groupKey: (b: Bet) => string
): EdgeRow[] {
  const map = new Map<string, { bets: Bet[] }>();
  for (const b of bets) {
    if (b.result === 'pending' || b.result === 'void') continue;
    const key = groupKey(b);
    if (!map.has(key)) map.set(key, { bets: [] });
    map.get(key)!.bets.push(b);
  }

  return Array.from(map.entries()).map(([label, { bets: group }]) => {
    const wins = group.filter(b => b.result === 'win' || b.result === 'half-win').length;
    const winRate = wins / group.length;
    const avgOdds = group.reduce((s, b) => s + b.odds, 0) / group.length;
    const breakEven = 1 / avgOdds;
    const edge = winRate - breakEven;
    const totalStake = group.reduce((s, b) => s + b.stake, 0);
    const pl = group.reduce((s, b) => s + calcProfitLoss(b), 0);
    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      bets: group.length,
      wins,
      winRate: parseFloat((winRate * 100).toFixed(1)),
      breakEven: parseFloat((breakEven * 100).toFixed(1)),
      edge: parseFloat((edge * 100).toFixed(1)),
      avgOdds: parseFloat(avgOdds.toFixed(2)),
      roi: totalStake > 0 ? parseFloat(((pl / totalStake) * 100).toFixed(1)) : 0,
      profitLoss: parseFloat(pl.toFixed(2)),
      reliable: group.length >= 10,
    };
  }).sort((a, b) => b.edge - a.edge);
}

export function getEdgeBySport(bets: Bet[]): EdgeRow[] {
  return buildEdgeRows(bets, b => b.sport);
}

export function getEdgeByBetType(bets: Bet[]): EdgeRow[] {
  return buildEdgeRows(bets, b => b.betType);
}

export function getEdgeByOddsRange(bets: Bet[]): EdgeRow[] {
  return buildEdgeRows(bets, b => {
    if (b.odds < 1.5) return 'Very Short (<1.5)';
    if (b.odds < 1.8) return 'Short (1.5–1.8)';
    if (b.odds < 2.2) return 'Evens (1.8–2.2)';
    if (b.odds < 3.0) return 'Medium (2.2–3.0)';
    if (b.odds < 5.0) return 'Long (3.0–5.0)';
    return 'Very Long (5.0+)';
  });
}

/** Kelly Criterion: fraction of bankroll to stake.
 *  winProb: estimated probability of winning (0–1)
 *  decimalOdds: e.g. 2.50
 *  Returns a fraction 0–1 (cap at 0.25 for safety).
 */
export function kellyCriterion(winProb: number, decimalOdds: number): number {
  const b = decimalOdds - 1; // net odds
  const q = 1 - winProb;
  const kelly = (b * winProb - q) / b;
  if (kelly <= 0) return 0;
  return Math.min(kelly, 0.25); // never bet more than 25%
}

export interface BetRecommendation {
  historicalWinRate: number | null;   // from sport history
  historicalBets: number;
  breakEven: number;
  edge: number | null;                // null if no history
  kellyFraction: number;              // using historical win rate
  kellyStake: number;                 // in $
  verdict: 'strong' | 'lean' | 'avoid' | 'insufficient-data';
  reason: string;
}

export function analyzeBet(
  bets: Bet[],
  sport: string,
  betType: string,
  odds: number,
  bankroll: number
): BetRecommendation {
  const settled = bets.filter(
    b => b.result !== 'pending' && b.result !== 'void'
  );
  const relevant = settled.filter(b => b.sport === sport && b.betType === betType);
  const sportOnly = settled.filter(b => b.sport === sport);

  // prefer sport+type, fall back to sport-only
  const sample = relevant.length >= 5 ? relevant : sportOnly;
  const sampleSize = sample.length;

  const breakEven = 1 / odds;

  if (sampleSize < 5) {
    return {
      historicalWinRate: null,
      historicalBets: sampleSize,
      breakEven: parseFloat((breakEven * 100).toFixed(1)),
      edge: null,
      kellyFraction: 0,
      kellyStake: 0,
      verdict: 'insufficient-data',
      reason: `Only ${sampleSize} historical bets for this sport/type. Need at least 5 to make a recommendation.`,
    };
  }

  const wins = sample.filter(b => b.result === 'win' || b.result === 'half-win').length;
  const winRate = wins / sampleSize;
  const edge = winRate - breakEven;
  const kelly = kellyCriterion(winRate, odds);
  const kellyStake = parseFloat((kelly * bankroll).toFixed(2));

  let verdict: BetRecommendation['verdict'];
  let reason: string;

  if (edge >= 0.05) {
    verdict = 'strong';
    reason = `Your win rate (${(winRate*100).toFixed(1)}%) is well above the break-even needed (${(breakEven*100).toFixed(1)}%). Strong historical edge.`;
  } else if (edge >= 0.01) {
    verdict = 'lean';
    reason = `Slight edge — your win rate (${(winRate*100).toFixed(1)}%) is just above break-even (${(breakEven*100).toFixed(1)}%). Proceed with caution.`;
  } else {
    verdict = 'avoid';
    reason = `Your historical win rate (${(winRate*100).toFixed(1)}%) is below the ${(breakEven*100).toFixed(1)}% needed to profit at these odds. Negative expected value.`;
  }

  return {
    historicalWinRate: parseFloat((winRate * 100).toFixed(1)),
    historicalBets: sampleSize,
    breakEven: parseFloat((breakEven * 100).toFixed(1)),
    edge: parseFloat((edge * 100).toFixed(1)),
    kellyFraction: parseFloat((kelly * 100).toFixed(1)),
    kellyStake,
    verdict,
    reason,
  };
}
