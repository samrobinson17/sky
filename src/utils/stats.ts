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
