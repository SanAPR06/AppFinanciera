import type { RecurringTransaction } from '../types';

function ym(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Determina si a una recurrente le toca generar su transacción del mes actual. */
export function isDueThisMonth(recurring: RecurringTransaction, now: Date = new Date()): boolean {
  if (!recurring.isActive) return false;
  const currentYm = ym(now);
  if (recurring.lastGeneratedYm === currentYm) return false;
  return now.getDate() >= recurring.dayOfMonth;
}

/** Fecha (ISO) que debe llevar la transacción generada este mes. */
export function occurrenceDateForThisMonth(
  recurring: RecurringTransaction,
  now: Date = new Date()
): string {
  const day = Math.min(recurring.dayOfMonth, daysInMonth(now.getFullYear(), now.getMonth()));
  return new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0).toISOString();
}

export function currentYm(now: Date = new Date()): string {
  return ym(now);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
