export interface ESPNGame {
  id: string;
  sport: 'tennis' | 'football';
  league: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  homeRecord?: string;
  awayRecord?: string;
  homeRank?: number;
  awayRank?: number;
  homeOdds?: number;   // decimal
  awayOdds?: number;
  drawOdds?: number;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

export interface BetCall {
  game: ESPNGame;
  selection: string;
  odds: number | null;
  verdict: 'bet' | 'skip';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// ESPN leagues to fetch
const FOOTBALL_LEAGUES = [
  { key: 'eng.1',    name: 'Premier League' },
  { key: 'esp.1',    name: 'La Liga' },
  { key: 'ger.1',    name: 'Bundesliga' },
  { key: 'ita.1',    name: 'Serie A' },
  { key: 'fra.1',    name: 'Ligue 1' },
  { key: 'usa.1',    name: 'MLS' },
  { key: 'uefa.champions', name: 'Champions League' },
];

const TENNIS_LEAGUES = [
  { key: 'atp',  name: 'ATP' },
  { key: 'wta',  name: 'WTA' },
];

async function fetchESPN(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN API error ${res.status}`);
  return res.json();
}

function parseOdds(event: Record<string, unknown>): { homeOdds?: number; awayOdds?: number; drawOdds?: number } {
  try {
    const comps = event.competitions as Record<string, unknown>[];
    const odds = comps?.[0]?.odds as Record<string, unknown>[] | undefined;
    if (!odds || odds.length === 0) return {};
    const o = odds[0] as Record<string, unknown>;
    // ESPN sometimes has awayTeamOdds / homeTeamOdds in American format
    const toDecimal = (american: number) =>
      american > 0 ? +(american / 100 + 1).toFixed(2) : +(100 / Math.abs(american) + 1).toFixed(2);

    const home = (o.homeTeamOdds as Record<string, unknown>)?.moneyLine as number | undefined;
    const away = (o.awayTeamOdds as Record<string, unknown>)?.moneyLine as number | undefined;
    const draw = (o.drawOdds as Record<string, unknown>)?.moneyLine as number | undefined;

    return {
      homeOdds: home ? toDecimal(home) : undefined,
      awayOdds: away ? toDecimal(away) : undefined,
      drawOdds: draw ? toDecimal(draw) : undefined,
    };
  } catch { return {}; }
}

function parseRecord(competitor: Record<string, unknown>): string | undefined {
  const stats = competitor.statistics as Record<string, unknown>[] | undefined;
  const wins = stats?.find((s) => s.name === 'wins')?.value as number | undefined;
  const losses = stats?.find((s) => s.name === 'losses')?.value as number | undefined;
  if (wins !== undefined && losses !== undefined) return `${wins}-${losses}`;
  return undefined;
}

function parseRank(competitor: Record<string, unknown>): number | undefined {
  const rank = (competitor.athlete as Record<string, unknown>)?.ranking as number | undefined;
  return rank ?? undefined;
}

async function fetchFootballLeague(leagueKey: string, leagueName: string): Promise<ESPNGame[]> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  try {
    const data = await fetchESPN(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueKey}/scoreboard?dates=${today}`
    ) as Record<string, unknown>;

    const events = (data.events as Record<string, unknown>[]) ?? [];
    return events.map((event) => {
      const comps = event.competitions as Record<string, unknown>[];
      const comp = comps?.[0];
      const competitors = comp?.competitors as Record<string, unknown>[];
      const home = competitors?.find((c) => c.homeAway === 'home');
      const away = competitors?.find((c) => c.homeAway === 'away');
      const status = (event.status as Record<string, unknown>)?.type as Record<string, unknown>;
      const odds = parseOdds(event);

      const homeScore = home?.score !== undefined ? Number(home.score) : undefined;
      const awayScore = away?.score !== undefined ? Number(away.score) : undefined;
      const statusName = status?.name as string;

      return {
        id: event.id as string,
        sport: 'football' as const,
        league: leagueName,
        commenceTime: event.date as string,
        homeTeam: (home?.team as Record<string, unknown>)?.displayName as string ?? 'Home',
        awayTeam: (away?.team as Record<string, unknown>)?.displayName as string ?? 'Away',
        homeRecord: parseRecord(home ?? {}),
        awayRecord: parseRecord(away ?? {}),
        homeOdds: odds.homeOdds,
        awayOdds: odds.awayOdds,
        drawOdds: odds.drawOdds,
        status: statusName === 'STATUS_IN_PROGRESS' ? 'live'
          : statusName === 'STATUS_FINAL' ? 'finished'
          : 'upcoming',
        homeScore,
        awayScore,
      } satisfies ESPNGame;
    });
  } catch { return []; }
}

async function fetchTennis(tourKey: string, tourName: string): Promise<ESPNGame[]> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  try {
    const data = await fetchESPN(
      `https://site.api.espn.com/apis/site/v2/sports/tennis/${tourKey}/scoreboard?dates=${today}`
    ) as Record<string, unknown>;

    const events = (data.events as Record<string, unknown>[]) ?? [];
    return events.map((event) => {
      const comps = event.competitions as Record<string, unknown>[];
      const comp = comps?.[0];
      const competitors = comp?.competitors as Record<string, unknown>[];
      const p1 = competitors?.[0];
      const p2 = competitors?.[1];
      const status = (event.status as Record<string, unknown>)?.type as Record<string, unknown>;
      const odds = parseOdds(event);
      const statusName = status?.name as string;

      const homeScore = p1?.score !== undefined ? Number(p1.score) : undefined;
      const awayScore = p2?.score !== undefined ? Number(p2.score) : undefined;

      return {
        id: event.id as string,
        sport: 'tennis' as const,
        league: `${tourName} – ${event.name as string ?? ''}`.trim(),
        commenceTime: event.date as string,
        homeTeam: (p1?.athlete as Record<string, unknown>)?.displayName as string ?? 'Player 1',
        awayTeam: (p2?.athlete as Record<string, unknown>)?.displayName as string ?? 'Player 2',
        homeRank: parseRank(p1 ?? {}),
        awayRank: parseRank(p2 ?? {}),
        homeOdds: odds.homeOdds,
        awayOdds: odds.awayOdds,
        status: statusName === 'STATUS_IN_PROGRESS' ? 'live'
          : statusName === 'STATUS_FINAL' ? 'finished'
          : 'upcoming',
        homeScore,
        awayScore,
      } satisfies ESPNGame;
    });
  } catch { return []; }
}

export async function fetchTodaysGames(): Promise<ESPNGame[]> {
  const [footballGames, tennisGames] = await Promise.all([
    Promise.all(FOOTBALL_LEAGUES.map(l => fetchFootballLeague(l.key, l.name))).then(r => r.flat()),
    Promise.all(TENNIS_LEAGUES.map(l => fetchTennis(l.key, l.name))).then(r => r.flat()),
  ]);
  return [...tennisGames, ...footballGames].filter(g => g.homeTeam && g.awayTeam);
}

/** Generate a BET or SKIP call for a game */
export function callBet(game: ESPNGame): BetCall {
  // Tennis: rank-based
  if (game.sport === 'tennis') {
    const r1 = game.homeRank;
    const r2 = game.awayRank;

    if (r1 && r2) {
      const diff = Math.abs(r1 - r2);
      const favourite = r1 < r2 ? game.homeTeam : game.awayTeam;
      const favouriteOdds = r1 < r2 ? game.homeOdds : game.awayOdds;

      if (diff >= 30) {
        return {
          game, selection: favourite, odds: favouriteOdds ?? null,
          verdict: 'bet', confidence: 'high',
          reason: `Ranking gap of ${diff} places. Higher-ranked players win ~75% of matches with this gap.`,
        };
      } else if (diff >= 10) {
        return {
          game, selection: favourite, odds: favouriteOdds ?? null,
          verdict: 'bet', confidence: 'medium',
          reason: `Moderate ranking edge of ${diff} places. Slight advantage to the higher-ranked player.`,
        };
      } else {
        return {
          game, selection: favourite, odds: favouriteOdds ?? null,
          verdict: 'skip', confidence: 'low',
          reason: `Rankings too close (${diff} places apart). Too much uncertainty — skip.`,
        };
      }
    }

    // No ranking data
    if (game.homeOdds && game.awayOdds) {
      const favourite = game.homeOdds < game.awayOdds ? game.homeTeam : game.awayTeam;
      const favOdds = Math.min(game.homeOdds, game.awayOdds);
      if (favOdds < 1.5) {
        return { game, selection: favourite, odds: favOdds, verdict: 'bet', confidence: 'medium', reason: `Odds imply ~${(100/favOdds).toFixed(0)}% win probability. Clear favourite.` };
      }
    }
    return { game, selection: '—', odds: null, verdict: 'skip', confidence: 'low', reason: 'Not enough data to make a call. Skip.' };
  }

  // Football/soccer
  const { homeOdds, awayOdds, drawOdds } = game;

  if (homeOdds && awayOdds) {
    const options = [
      { name: game.homeTeam, odds: homeOdds },
      { name: game.awayTeam, odds: awayOdds },
      ...(drawOdds ? [{ name: 'Draw', odds: drawOdds }] : []),
    ];
    const favourite = options.reduce((a, b) => a.odds < b.odds ? a : b);
    const impliedProb = 1 / favourite.odds;

    if (impliedProb >= 0.60) {
      return {
        game, selection: favourite.name, odds: favourite.odds,
        verdict: 'bet', confidence: 'high',
        reason: `Heavy favourite at ${favourite.odds.toFixed(2)} odds (~${(impliedProb*100).toFixed(0)}% implied win probability).`,
      };
    } else if (impliedProb >= 0.48) {
      return {
        game, selection: favourite.name, odds: favourite.odds,
        verdict: 'bet', confidence: 'medium',
        reason: `${favourite.name} are favourites at ${favourite.odds.toFixed(2)}. Reasonable value if your analysis agrees.`,
      };
    } else {
      return {
        game, selection: '—', odds: null,
        verdict: 'skip', confidence: 'low',
        reason: 'No clear favourite — odds too close across all outcomes. Skip.',
      };
    }
  }

  // No odds: use home advantage
  return {
    game, selection: game.homeTeam, odds: null,
    verdict: 'bet', confidence: 'low',
    reason: 'No odds available. Home advantage general lean — but treat this as low confidence.',
  };
}
