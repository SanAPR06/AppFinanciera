import { useMemo, useState } from 'react';
import { Pencil, Receipt } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useToastStore } from '../store/useToastStore';
import { formatMoney } from './AccountCard';
import { SwipeToDelete } from './SwipeToDelete';
import type { Transaction, TxType } from '../types';

const TYPE_LABELS: Record<TxType, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

const TYPE_COLOR: Record<TxType, string> = {
  income: 'text-emerald-500',
  expense: 'text-red-500',
  transfer: 'text-sky-500',
};

export function TransactionList({
  onEdit,
  compact = false,
  limit,
}: {
  onEdit: (t: Transaction) => void;
  compact?: boolean;
  limit?: number;
}) {
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const pushToast = useToastStore((s) => s.push);

  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<TxType | ''>('');

  const accountById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  let filtered = transactions
    .filter((t) => !accountFilter || t.accountId === accountFilter || t.destinationAccountId === accountFilter)
    .filter((t) => !typeFilter || t.type === typeFilter)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  if (limit) filtered = filtered.slice(0, limit);

  const groups = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const dayKey = new Date(t.occurredAt).toDateString();
      if (!byDay.has(dayKey)) byDay.set(dayKey, []);
      byDay.get(dayKey)!.push(t);
    }
    return [...byDay.entries()];
  }, [filtered]);

  function dayLabel(dayKey: string) {
    const date = new Date(dayKey);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dayKey === today) return 'Hoy';
    if (dayKey === yesterday) return 'Ayer';
    return date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function handleDelete(t: Transaction) {
    deleteTransaction(t.id);
    pushToast('Transacción eliminada', 'success');
  }

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex gap-2 flex-wrap pt-4">
          <select
            className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-1.5 text-body-sm"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-1.5 text-body-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TxType | '')}
          >
            <option value="">Todos los tipos</option>
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Receipt size={28} className="text-ash dark:text-graphite/60" />
          <p className="text-graphite text-body-sm">No hay transacciones aún.</p>
        </div>
      )}

      <div className={`flex flex-col gap-4 ${compact ? 'pt-4' : ''}`}>
        {groups.map(([dayKey, dayTransactions]) => (
          <div key={dayKey}>
            <h3 className="text-eyebrow font-medium uppercase tracking-eyebrow text-graphite dark:text-smoke mb-1 capitalize">
              {dayLabel(dayKey)}
            </h3>
            <ul className="flex flex-col divide-y divide-ash dark:divide-graphite/40">
              {dayTransactions.map((t) => {
                const account = accountById[t.accountId];
                const destination = t.destinationAccountId ? accountById[t.destinationAccountId] : null;
                const category = t.categoryId ? categoryById[t.categoryId] : null;
                return (
                  <li key={t.id}>
                    <SwipeToDelete onDelete={() => handleDelete(t)}>
                      <div className="py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className={`text-body-sm font-medium ${TYPE_COLOR[t.type]}`}>
                            {TYPE_LABELS[t.type]}
                            {category ? ` · ${category.name}` : ''}
                          </span>
                          <span className="text-caption text-graphite dark:text-smoke">
                            {account?.name}
                            {destination ? ` → ${destination.name}` : ''}
                            {' · '}
                            {new Date(t.occurredAt).toLocaleTimeString('es-VE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {t.note && <span className="text-caption text-graphite">{t.note}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${TYPE_COLOR[t.type]}`}>
                            {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                            {formatMoney(t.amount, t.currency)}
                          </span>
                          <button
                            onClick={() => onEdit(t)}
                            className="text-graphite dark:text-smoke hover:text-off-black-ink dark:hover:text-off-white-canvas p-1"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </div>
                    </SwipeToDelete>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
