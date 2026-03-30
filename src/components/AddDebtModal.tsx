import { useState } from 'react';
import type { Debt, DebtCategory } from '../types';

interface Props {
  onSave: (debt: Debt) => void;
  onClose: () => void;
  editDebt?: Debt | null;
}

const CATEGORIES: { value: DebtCategory; label: string }[] = [
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'student-loan', label: 'Student Loan' },
  { value: 'auto', label: 'Auto Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 5,
  display: 'block',
  fontWeight: 500,
};

export default function AddDebtModal({ onSave, onClose, editDebt }: Props) {
  const [name, setName] = useState(editDebt?.name ?? '');
  const [balance, setBalance] = useState(editDebt ? String(editDebt.balance) : '');
  const [apr, setApr] = useState(editDebt ? String(editDebt.apr) : '');
  const [minPayment, setMinPayment] = useState(editDebt ? String(editDebt.minPayment) : '');
  const [category, setCategory] = useState<DebtCategory>(editDebt?.category ?? 'credit-card');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(field: string) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    if (!balance || isNaN(+balance) || +balance <= 0) e.balance = 'Enter a valid amount';
    if (!apr || isNaN(+apr) || +apr < 0 || +apr > 100) e.apr = 'Enter 0–100';
    if (!minPayment || isNaN(+minPayment) || +minPayment <= 0) e.minPayment = 'Enter a valid amount';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({
      id: editDebt?.id ?? crypto.randomUUID(),
      name: name.trim(),
      balance: +parseFloat(balance).toFixed(2),
      apr: +parseFloat(apr).toFixed(3),
      minPayment: +parseFloat(minPayment).toFixed(2),
      category,
    });
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--modal-bg)', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 460, border: '1px solid var(--border)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ margin: '0 0 22px', fontSize: 18, fontWeight: 700 }}>
          {editDebt ? 'Edit Debt' : 'Add Debt'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Debt Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. Chase Freedom Card"
              value={name}
              onChange={e => { setName(e.target.value); clearError('name'); }}
              autoFocus
            />
            {errors.name && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.name}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Current Balance ($)</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={balance}
                onChange={e => { setBalance(e.target.value); clearError('balance'); }}
              />
              {errors.balance && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.balance}</div>}
            </div>
            <div>
              <label style={labelStyle}>APR (%)</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="24.99"
                value={apr}
                onChange={e => { setApr(e.target.value); clearError('apr'); }}
              />
              {errors.apr && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.apr}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Min Payment ($/mo)</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                placeholder="150"
                value={minPayment}
                onChange={e => { setMinPayment(e.target.value); clearError('minPayment'); }}
              />
              {errors.minPayment && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.minPayment}</div>}
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={category}
                onChange={e => setCategory(e.target.value as DebtCategory)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 26, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 22px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            {editDebt ? 'Save Changes' : 'Add Debt'}
          </button>
        </div>
      </div>
    </div>
  );
}
