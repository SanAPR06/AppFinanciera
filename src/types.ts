export type AccountType =
  | 'bank'
  | 'cash'
  | 'credit_card'
  | 'digital_wallet'
  | 'savings'
  | 'other';

export type TxType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  isArchived: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  color: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  note?: string;
  occurredAt: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  note?: string;
  dayOfMonth: number;
  isActive: boolean;
  lastGeneratedYm?: string;
  createdAt: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: 'Banco',
  cash: 'Efectivo',
  credit_card: 'Tarjeta de Crédito',
  digital_wallet: 'Billetera Digital',
  savings: 'Ahorros',
  other: 'Otro',
};

export const CURRENCIES = ['USD', 'VES', 'EUR'];
