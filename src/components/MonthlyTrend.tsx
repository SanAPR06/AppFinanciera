import { useMemo } from 'react';
import type { Transaction } from '../types';
import { formatMoney } from './AccountCard';

const MONTHS_BACK = 6;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthlyTrend({
  transactions,
  currency,
}: {
  transactions: Transaction[];
  currency: string;
}) {
  const months = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        key: monthKey(d),
        label: d.toLocaleDateString('es-VE', { month: 'short' }).replace('.', ''),
        income: 0,
        expense: 0,
      });
    }
    const byKey = new Map(list.map((m) => [m.key, m]));
    for (const t of transactions) {
      if (t.currency !== currency) continue;
      if (t.type !== 'income' && t.type !== 'expense') continue;
      const key = monthKey(new Date(t.occurredAt));
      const bucket = byKey.get(key);
      if (!bucket) continue;
      if (t.type === 'income') bucket.income += t.amount;
      else bucket.expense += t.amount;
    }
    return list;
  }, [transactions, currency]);

  const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));
  const hasAnyData = months.some((m) => m.income > 0 || m.expense > 0);

  if (!hasAnyData) return null;

  return (
    <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-body-sm font-medium text-off-black-ink dark:text-off-white-canvas">
          Ingresos vs. gastos
        </h3>
        <div className="flex items-center gap-3 text-caption text-graphite dark:text-smoke">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-pills bg-emerald-500" /> Ingreso
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-pills bg-red-500" /> Gasto
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-32 mt-4">
        {months.map((m) => (
          <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 h-24 w-full justify-center">
              <div
                title={`Ingreso: ${formatMoney(m.income, currency)}`}
                className="w-1/2 max-w-3 rounded-t-inner bg-emerald-500"
                style={{ height: `${(m.income / max) * 100}%`, minHeight: m.income > 0 ? 2 : 0 }}
              />
              <div
                title={`Gasto: ${formatMoney(m.expense, currency)}`}
                className="w-1/2 max-w-3 rounded-t-inner bg-red-500"
                style={{ height: `${(m.expense / max) * 100}%`, minHeight: m.expense > 0 ? 2 : 0 }}
              />
            </div>
            <span className="text-eyebrow uppercase text-graphite dark:text-smoke">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
