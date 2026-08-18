import type { Account, Transaction } from '../types';

/** Saldo actual = Saldo Inicial + Ingresos - Gastos ± Transferencias */
export function computeAccountBalance(account: Account, transactions: Transaction[]): number {
  return transactions.reduce((balance, t) => {
    if (t.type === 'income' && t.accountId === account.id) return balance + t.amount;
    if (t.type === 'expense' && t.accountId === account.id) return balance - t.amount;
    if (t.type === 'transfer') {
      if (t.accountId === account.id) return balance - t.amount;
      if (t.destinationAccountId === account.id) return balance + t.amount;
    }
    return balance;
  }, account.initialBalance);
}

export function computeAllBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  return Object.fromEntries(
    accounts.map((a) => [a.id, computeAccountBalance(a, transactions)])
  );
}

/** Suma los saldos agrupados por moneda, sin conversión (evita depender de tasas desactualizadas). */
export function computeTotalsByCurrency(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  return accounts
    .filter((a) => !a.isArchived)
    .reduce<Record<string, number>>((totals, acc) => {
      const balance = computeAccountBalance(acc, transactions);
      totals[acc.currency] = (totals[acc.currency] ?? 0) + balance;
      return totals;
    }, {});
}
