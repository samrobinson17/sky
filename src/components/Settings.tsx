import { useState } from 'react';

interface SettingsProps {
  apiKey: string;
  bankroll: number;
  onSave: (apiKey: string, bankroll: number) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function Settings({ apiKey, bankroll, onSave }: SettingsProps) {
  const [key, setKey] = useState(apiKey);
  const [br, setBr] = useState(String(bankroll));
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(key.trim(), parseFloat(br) || 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Bankroll</h3>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Current bankroll ($)
            </label>
            <input
              type="number"
              value={br}
              onChange={e => setBr(e.target.value)}
              placeholder="e.g. 1000"
              step="0.01"
              style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Used to calculate Kelly Criterion stake amounts.
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>The Odds API</h3>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              API Key
            </label>
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Paste your key here"
              style={{ ...inputStyle, fontFamily: 'monospace' }}
              spellCheck={false}
            />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Free at <strong style={{ color: 'var(--text-secondary)' }}>the-odds-api.com</strong> — 500 requests/month free.
              Your key is stored only in your browser (localStorage), never sent anywhere except directly to the-odds-api.com.
            </p>
          </div>
        </div>

        <button
          type="submit"
          style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saved ? 'var(--green)' : 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: 'fit-content', transition: 'background 0.2s' }}
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
