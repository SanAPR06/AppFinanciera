import { useMemo } from 'react';
import type { Category, Transaction } from '../types';
import { formatMoney } from './AccountCard';

const SERIES_VARS = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
  'var(--series-8)',
];

export function CategoryBreakdown({
  transactions,
  categories,
  currency,
}: {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}) {
  const now = new Date();

  const breakdown = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense' || t.currency !== currency) continue;
      const d = new Date(t.occurredAt);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
      const key = t.categoryId ?? '__none__';
      totals.set(key, (totals.get(key) ?? 0) + t.amount);
    }
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const rows = [...totals.entries()]
      .map(([categoryId, amount]) => ({
        categoryId,
        name: categoryId === '__none__' ? 'Sin categoría' : categoryById.get(categoryId)?.name ?? 'Otro',
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return { rows, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories, currency]);

  const monthLabel = now.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });

  if (breakdown.total === 0) {
    return (
      <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards p-4 mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-body-sm font-medium text-off-black-ink dark:text-off-white-canvas capitalize">
            Gastos por categoría
          </h3>
          <span className="text-caption text-graphite dark:text-smoke capitalize">{monthLabel}</span>
        </div>
        <p className="text-caption text-graphite dark:text-smoke">
          Sin gastos en {currency} este mes. Si registraste en otra moneda, cambia el toggle de arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards p-4 mb-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-body-sm font-medium text-off-black-ink dark:text-off-white-canvas capitalize">
          Gastos por categoría
        </h3>
        <span className="text-caption text-graphite dark:text-smoke capitalize">{monthLabel}</span>
      </div>

      <div className="flex h-4 rounded-pills overflow-hidden gap-0.5 mb-4 bg-ash dark:bg-graphite/40">
        {breakdown.rows.map((row, i) => (
          <div
            key={row.categoryId}
            title={`${row.name}: ${formatMoney(row.amount, currency)}`}
            style={{
              width: `${(row.amount / breakdown.total) * 100}%`,
              backgroundColor: SERIES_VARS[i % SERIES_VARS.length],
            }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {breakdown.rows.map((row, i) => {
          const pct = (row.amount / breakdown.total) * 100;
          return (
            <li key={row.categoryId} className="flex items-center gap-2 text-body-sm">
              <span
                className="w-2.5 h-2.5 rounded-pills shrink-0"
                style={{ backgroundColor: SERIES_VARS[i % SERIES_VARS.length] }}
              />
              <span className="flex-1 text-off-black-ink dark:text-off-white-canvas truncate">{row.name}</span>
              <span className="text-graphite dark:text-smoke text-caption">{pct.toFixed(0)}%</span>
              <span className="font-medium text-off-black-ink dark:text-off-white-canvas tabular-nums">
                {formatMoney(row.amount, currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
