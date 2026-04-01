import type { OddsGame } from './oddsApi';

// Realistic sample odds for demo mode
export const DEMO_GAMES: OddsGame[] = [
  {
    id: 'demo-1',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: new Date(Date.now() + 4 * 3600000).toISOString(),
    home_team: 'Boston Celtics',
    away_team: 'Miami Heat',
    bookmakers: [
      {
        key: 'draftkings', title: 'DraftKings',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Boston Celtics', price: 1.59 }, { name: 'Miami Heat', price: 2.45 }] },
          { key: 'spreads', outcomes: [{ name: 'Boston Celtics', price: 1.91, point: -7.5 }, { name: 'Miami Heat', price: 1.91, point: 7.5 }] },
          { key: 'totals', outcomes: [{ name: 'Over', price: 1.91, point: 218.5 }, { name: 'Under', price: 1.91, point: 218.5 }] },
        ],
      },
      {
        key: 'fanduel', title: 'FanDuel',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Boston Celtics', price: 1.62 }, { name: 'Miami Heat', price: 2.40 }] },
        ],
      },
    ],
  },
  {
    id: 'demo-2',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: new Date(Date.now() + 6 * 3600000).toISOString(),
    home_team: 'Golden State Warriors',
    away_team: 'Los Angeles Lakers',
    bookmakers: [
      {
        key: 'draftkings', title: 'DraftKings',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Golden State Warriors', price: 1.75 }, { name: 'Los Angeles Lakers', price: 2.10 }] },
          { key: 'spreads', outcomes: [{ name: 'Golden State Warriors', price: 1.91, point: -3.5 }, { name: 'Los Angeles Lakers', price: 1.91, point: 3.5 }] },
          { key: 'totals', outcomes: [{ name: 'Over', price: 1.87, point: 224.5 }, { name: 'Under', price: 1.95, point: 224.5 }] },
        ],
      },
    ],
  },
  {
    id: 'demo-3',
    sport_key: 'americanfootball_nfl',
    sport_title: 'NFL',
    commence_time: new Date(Date.now() + 24 * 3600000).toISOString(),
    home_team: 'Kansas City Chiefs',
    away_team: 'Buffalo Bills',
    bookmakers: [
      {
        key: 'draftkings', title: 'DraftKings',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Kansas City Chiefs', price: 1.71 }, { name: 'Buffalo Bills', price: 2.20 }] },
          { key: 'spreads', outcomes: [{ name: 'Kansas City Chiefs', price: 1.91, point: -3.5 }, { name: 'Buffalo Bills', price: 1.91, point: 3.5 }] },
          { key: 'totals', outcomes: [{ name: 'Over', price: 1.91, point: 48.5 }, { name: 'Under', price: 1.91, point: 48.5 }] },
        ],
      },
      {
        key: 'betmgm', title: 'BetMGM',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Kansas City Chiefs', price: 1.69 }, { name: 'Buffalo Bills', price: 2.25 }] },
          { key: 'spreads', outcomes: [{ name: 'Kansas City Chiefs', price: 1.95, point: -3.5 }, { name: 'Buffalo Bills', price: 1.87, point: 3.5 }] },
        ],
      },
    ],
  },
  {
    id: 'demo-4',
    sport_key: 'americanfootball_nfl',
    sport_title: 'NFL',
    commence_time: new Date(Date.now() + 26 * 3600000).toISOString(),
    home_team: 'San Francisco 49ers',
    away_team: 'Dallas Cowboys',
    bookmakers: [
      {
        key: 'draftkings', title: 'DraftKings',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'San Francisco 49ers', price: 1.50 }, { name: 'Dallas Cowboys', price: 2.70 }] },
          { key: 'spreads', outcomes: [{ name: 'San Francisco 49ers', price: 1.91, point: -6.5 }, { name: 'Dallas Cowboys', price: 1.91, point: 6.5 }] },
          { key: 'totals', outcomes: [{ name: 'Over', price: 1.91, point: 45.5 }, { name: 'Under', price: 1.91, point: 45.5 }] },
        ],
      },
    ],
  },
  {
    id: 'demo-5',
    sport_key: 'baseball_mlb',
    sport_title: 'MLB',
    commence_time: new Date(Date.now() + 5 * 3600000).toISOString(),
    home_team: 'New York Yankees',
    away_team: 'Boston Red Sox',
    bookmakers: [
      {
        key: 'draftkings', title: 'DraftKings',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'New York Yankees', price: 1.67 }, { name: 'Boston Red Sox', price: 2.25 }] },
          { key: 'totals', outcomes: [{ name: 'Over', price: 1.91, point: 8.5 }, { name: 'Under', price: 1.91, point: 8.5 }] },
        ],
      },
    ],
  },
  {
    id: 'demo-6',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: new Date(Date.now() + 48 * 3600000).toISOString(),
    home_team: 'Arsenal',
    away_team: 'Manchester City',
    bookmakers: [
      {
        key: 'bet365', title: 'Bet365',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Arsenal', price: 2.80 }, { name: 'Manchester City', price: 2.50 }, { name: 'Draw', price: 3.40 }] },
        ],
      },
      {
        key: 'draftkings', title: 'DraftKings',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Arsenal', price: 2.75 }, { name: 'Manchester City', price: 2.55 }, { name: 'Draw', price: 3.30 }] },
          { key: 'totals', outcomes: [{ name: 'Over', price: 1.87, point: 2.5 }, { name: 'Under', price: 1.95, point: 2.5 }] },
        ],
      },
    ],
  },
  {
    id: 'demo-7',
    sport_key: 'icehockey_nhl',
    sport_title: 'NHL',
    commence_time: new Date(Date.now() + 7 * 3600000).toISOString(),
    home_team: 'Toronto Maple Leafs',
    away_team: 'Montreal Canadiens',
    bookmakers: [
      {
        key: 'draftkings', title: 'DraftKings',
        markets: [
          { key: 'h2h', outcomes: [{ name: 'Toronto Maple Leafs', price: 1.65 }, { name: 'Montreal Canadiens', price: 2.35 }] },
          { key: 'totals', outcomes: [{ name: 'Over', price: 1.91, point: 6.0 }, { name: 'Under', price: 1.91, point: 6.0 }] },
        ],
      },
    ],
  },
];

export const DEMO_SPORT_KEYS = [
  'basketball_nba',
  'americanfootball_nfl',
  'baseball_mlb',
  'soccer_epl',
  'icehockey_nhl',
];
