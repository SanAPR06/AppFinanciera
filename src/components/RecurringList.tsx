import { useMemo } from 'react';
import { Pencil, X, Repeat } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useToastStore } from '../store/useToastStore';
import { formatMoney } from './AccountCard';
import type { RecurringTransaction, TxType } from '../types';

const TYPE_LABELS: Record<TxType, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

const TYPE_COLOR: Record<TxType, string> = {
  income: 'text-emerald-600',
  expense: 'text-red-500',
  transfer: 'text-sky-500',
};

export function RecurringList({ onEdit }: { onEdit: (r: RecurringTransaction) => void }) {
  const recurringTransactions = useFinanceStore((s) => s.recurringTransactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const toggleRecurringActive = useFinanceStore((s) => s.toggleRecurringActive);
  const deleteRecurring = useFinanceStore((s) => s.deleteRecurring);
  const pushToast = useToastStore((s) => s.push);

  const accountById = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  function handleDelete(id: string) {
    deleteRecurring(id);
    pushToast('Recurrente eliminada', 'success');
  }

  if (recurringTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Repeat size={24} className="text-ash dark:text-graphite/60" />
        <p className="text-graphite text-body-sm">Aún no tienes transacciones recurrentes.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-ash dark:divide-graphite/40">
      {recurringTransactions.map((r) => {
        const account = accountById[r.accountId];
        const category = r.categoryId ? categoryById[r.categoryId] : null;
        return (
          <li key={r.id} className="py-3 flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-medium ${TYPE_COLOR[r.type]}`}>
                {TYPE_LABELS[r.type]}
                {category ? ` · ${category.name}` : ''}
              </span>
              <span className="text-caption text-graphite dark:text-smoke truncate">
                {account?.name} · Día {r.dayOfMonth}
                {r.note ? ` · ${r.note}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-medium text-body-sm ${TYPE_COLOR[r.type]}`}>
                {formatMoney(r.amount, r.currency)}
              </span>
              <button
                onClick={() => toggleRecurringActive(r.id, !r.isActive)}
                className={`relative w-9 h-5 rounded-pills transition-colors ${
                  r.isActive ? 'bg-electric-lime' : 'bg-ash dark:bg-graphite/40'
                }`}
                title={r.isActive ? 'Activa' : 'Pausada'}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-pills bg-off-black-ink transition-transform ${
                    r.isActive ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <button
                onClick={() => onEdit(r)}
                className="text-graphite dark:text-smoke hover:text-off-black-ink dark:hover:text-off-white-canvas p-1"
                title="Editar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-graphite dark:text-smoke hover:text-red-500 p-1"
                title="Eliminar"
              >
                <X size={15} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
