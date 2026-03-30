export type DebtCategory = 'credit-card' | 'student-loan' | 'auto' | 'personal' | 'medical' | 'other';

export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  category: DebtCategory;
}

export type Strategy = 'avalanche' | 'snowball';

export interface DebtPayment {
  debtId: string;
  principal: number;
  interest: number;
  remaining: number;
}

export interface PayoffMonth {
  month: number;
  date: string;
  payments: DebtPayment[];
  totalPaid: number;
  totalInterest: number;
  totalRemaining: number;
}

export interface PayoffResult {
  strategy: Strategy;
  months: PayoffMonth[];
  totalInterestPaid: number;
  totalPaid: number;
  payoffDate: string;
  monthsToPayoff: number;
}
