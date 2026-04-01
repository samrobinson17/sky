export interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

export interface OddsMarket {
  key: string; // h2h, spreads, totals
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number; // decimal odds
  point?: number; // spread/total line
}

export interface ValueBet {
  gameId: string;
  event: string;
  sport: string;
  sportKey: string;
  commenceTime: string;
  bookmaker: string;
  market: string;       // h2h / spreads / totals
  betType: string;      // mapped to our BetType
  selection: string;
  odds: number;
  breakEven: number;
  historicalWinRate: number | null;
  historicalBets: number;
  edge: number | null;
  kellyFraction: number;
  kellyStake: number;
  verdict: 'strong' | 'lean' | 'avoid' | 'no-data';
}

const BASE = 'https://api.the-odds-api.com/v4';

const SPORT_MAP: Record<string, string> = {
  americanfootball_nfl: 'football',
  americanfootball_ncaaf: 'football',
  basketball_nba: 'basketball',
  basketball_ncaab: 'basketball',
  baseball_mlb: 'baseball',
  icehockey_nhl: 'hockey',
  soccer_epl: 'soccer',
  soccer_usa_mls: 'soccer',
  soccer_uefa_champs_league: 'soccer',
  tennis_atp_us_open: 'tennis',
  tennis_wta_us_open: 'tennis',
  golf_pga_championship: 'golf',
  mma_mixed_martial_arts: 'mma',
  boxing_boxing: 'boxing',
};

const MARKET_TO_BET_TYPE: Record<string, string> = {
  h2h: 'moneyline',
  spreads: 'spread',
  totals: 'over/under',
};

export async function fetchSports(apiKey: string): Promise<{ key: string; title: string; active: boolean }[]> {
  const res = await fetch(`${BASE}/sports?apiKey=${apiKey}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchOdds(apiKey: string, sportKey: string): Promise<OddsGame[]> {
  const res = await fetch(
    `${BASE}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=us,uk&markets=h2h,spreads,totals&oddsFormat=decimal`
  );
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function mapSport(sportKey: string): string {
  return SPORT_MAP[sportKey] ?? 'other';
}

export function mapBetType(market: string): string {
  return MARKET_TO_BET_TYPE[market] ?? 'other';
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
