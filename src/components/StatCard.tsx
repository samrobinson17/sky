interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, positive, accent }: StatCardProps) {
  let valueColor = 'var(--text-primary)';
  if (positive === true) valueColor = 'var(--green)';
  if (positive === false) valueColor = 'var(--red)';

  return (
    <div
      style={{
        background: accent ? 'var(--accent-bg)' : 'var(--card-bg)',
        border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontSize: 28, fontWeight: 700, color: valueColor, lineHeight: 1.1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</span>
      )}
    </div>
  );
}
