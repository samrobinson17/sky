import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { Bet } from '../types';
import { computeStats, getProfitLossByDate, getStatsBySport } from '../utils/stats';
import StatCard from './StatCard';

interface DashboardProps {
  bets: Bet[];
}

function fmt(n: number, currency = '$') {
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `-${currency}${abs}` : `${currency}${abs}`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export default function Dashboard({ bets }: DashboardProps) {
  const stats = computeStats(bets);
  const plHistory = getProfitLossByDate(bets);
  const sportStats = getStatsBySport(bets);

  if (bets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          No bets yet
        </h2>
        <p style={{ fontSize: 14 }}>Add your first bet to start tracking your performance.</p>
      </div>
    );
  }

  const plPositive = stats.profitLoss >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Key stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard
          label="Profit / Loss"
          value={fmt(stats.profitLoss)}
          sub={`ROI: ${fmtPct(stats.roi)}`}
          positive={plPositive}
          accent
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.wins}W – ${stats.losses}L`}
          positive={stats.winRate >= 50 ? true : null}
        />
        <StatCard
          label="Total Bets"
          value={String(stats.totalBets)}
          sub={`${stats.settledBets} settled, ${stats.totalBets - stats.settledBets} pending`}
        />
        <StatCard
          label="Total Staked"
          value={fmt(stats.totalStaked)}
          sub={`Avg stake: ${fmt(stats.avgStake)}`}
        />
        <StatCard
          label="Avg Odds"
          value={stats.avgOdds.toFixed(2)}
          sub="Decimal"
        />
        <StatCard
          label="Current Streak"
          value={`${stats.currentStreak}${stats.streakType !== 'none' ? (stats.streakType === 'win' ? 'W' : 'L') : ''}`}
          positive={stats.streakType === 'win' ? true : stats.streakType === 'loss' ? false : null}
        />
        <StatCard
          label="Best Win"
          value={fmt(stats.biggestWin)}
          positive={stats.biggestWin > 0 ? true : null}
        />
        <StatCard
          label="Worst Loss"
          value={fmt(stats.biggestLoss)}
          positive={stats.biggestLoss < 0 ? false : null}
        />
      </div>

      {/* P/L chart */}
      {plHistory.length > 1 && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Cumulative P/L
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={plHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickFormatter={(v: number) => `$${v}`}
                width={60}
              />
              <Tooltip
                formatter={(v: number) => [fmt(v), 'P/L']}
                contentStyle={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke={plPositive ? 'var(--green)' : 'var(--red)'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats by sport */}
      {sportStats.length > 0 && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            P/L by Sport
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sportStats} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="sport" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickFormatter={(v: number) => `$${v}`}
                width={60}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  name === 'profitLoss' ? fmt(v) : `${v}%`,
                  name === 'profitLoss' ? 'P/L' : 'ROI',
                ]}
                contentStyle={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="profitLoss" radius={[4, 4, 0, 0]}>
                {sportStats.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.profitLoss >= 0 ? 'var(--green)' : 'var(--red)'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
