import { useMemo, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowLeftRight, Landmark, Banknote, CreditCard, Smartphone, PiggyBank, Folder } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useToastStore } from '../store/useToastStore';
import type { Account, RecurringTransaction, TxType } from '../types';

const TYPE_CONFIG: Record<TxType, { label: string; icon: typeof TrendingUp }> = {
  income: { label: 'Ingreso', icon: TrendingUp },
  expense: { label: 'Gasto', icon: TrendingDown },
  transfer: { label: 'Transferencia', icon: ArrowLeftRight },
};

const ACCOUNT_TYPE_ICON: Record<Account['type'], typeof Landmark> = {
  bank: Landmark,
  cash: Banknote,
  credit_card: CreditCard,
  digital_wallet: Smartphone,
  savings: PiggyBank,
  other: Folder,
};

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs' };

export function NewRecurringForm({
  onClose,
  editingRecurring,
}: {
  onClose: () => void;
  editingRecurring?: RecurringTransaction;
}) {
  const allAccounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const accounts = useMemo(() => allAccounts.filter((a) => !a.isArchived), [allAccounts]);
  const addRecurring = useFinanceStore((s) => s.addRecurring);
  const updateRecurring = useFinanceStore((s) => s.updateRecurring);
  const pushToast = useToastStore((s) => s.push);

  const [type, setType] = useState<TxType>(editingRecurring?.type ?? 'expense');
  const [amount, setAmount] = useState(editingRecurring ? String(editingRecurring.amount) : '');
  const [accountId, setAccountId] = useState(editingRecurring?.accountId ?? accounts[0]?.id ?? '');
  const [destinationAccountId, setDestinationAccountId] = useState(
    editingRecurring?.destinationAccountId ?? ''
  );
  const [categoryId, setCategoryId] = useState(editingRecurring?.categoryId ?? '');
  const [note, setNote] = useState(editingRecurring?.note ?? '');
  const [dayOfMonth, setDayOfMonth] = useState(
    editingRecurring ? editingRecurring.dayOfMonth : 1
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const filteredCategories = categories.filter((c) => c.kind === type);
  const currencySymbol = CURRENCY_SYMBOLS[selectedAccount?.currency ?? 'USD'] ?? selectedAccount?.currency ?? '$';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (submittingRef.current) return;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    if (!accountId) {
      setError('Selecciona una cuenta.');
      return;
    }
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 28) {
      setError('El día del mes debe estar entre 1 y 28.');
      return;
    }
    if (type === 'transfer' && (!destinationAccountId || destinationAccountId === accountId)) {
      setError('Selecciona una cuenta destino distinta a la de origen.');
      return;
    }

    const payload = {
      type,
      amount: numericAmount,
      currency: selectedAccount?.currency ?? 'USD',
      accountId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      categoryId: type !== 'transfer' ? categoryId || undefined : undefined,
      note: note.trim() || undefined,
      dayOfMonth,
    };
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (editingRecurring) {
        await updateRecurring(editingRecurring.id, payload);
        pushToast('Recurrente actualizada', 'success');
      } else {
        await addRecurring(payload);
        pushToast('Recurrente creada', 'success');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Intenta de nuevo.');
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <p className="text-graphite dark:text-smoke">
        Primero crea una cuenta para poder agregar una transacción recurrente.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h3 className="text-body-sm font-medium text-graphite dark:text-smoke text-center uppercase tracking-eyebrow">
        {editingRecurring ? 'Editar recurrente' : 'Nueva transacción recurrente'}
      </h3>

      <div className="flex gap-2 bg-off-white-canvas dark:bg-off-black-ink rounded-buttons p-1">
        {(Object.keys(TYPE_CONFIG) as TxType[]).map((t) => {
          const { label, icon: Icon } = TYPE_CONFIG[t];
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setCategoryId('');
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-buttons text-caption font-medium transition-colors ${
                active ? 'bg-electric-lime text-off-black-ink' : 'text-graphite dark:text-smoke'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1 py-2 max-w-full overflow-hidden">
        <span
          className={`font-medium text-graphite dark:text-smoke shrink-0 ${
            amount.length > 6 ? 'text-subheading' : 'text-heading'
          }`}
        >
          {currencySymbol}
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          style={{ width: `${Math.max(2, amount.length || 1) + 0.5}ch` }}
          className={`max-w-full font-medium text-off-black-ink dark:text-off-white-canvas bg-transparent text-center outline-none tabular-nums ${
            amount.length > 6 ? 'text-heading tracking-heading' : 'text-heading-lg tracking-heading-lg'
          }`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-caption font-medium text-graphite dark:text-smoke">
          {type === 'transfer' ? 'Desde' : 'Cuenta'}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {accounts.map((a) => {
            const Icon = ACCOUNT_TYPE_ICON[a.type];
            const active = accountId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-pills text-body-sm font-medium border shrink-0 ${
                  active
                    ? 'bg-off-black-ink text-electric-lime border-off-black-ink dark:bg-electric-lime dark:text-off-black-ink dark:border-electric-lime'
                    : 'border-ash dark:border-graphite/40 text-graphite dark:text-smoke'
                }`}
              >
                <Icon size={14} />
                {a.name}
              </button>
            );
          })}
        </div>
      </div>

      {type === 'transfer' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-graphite dark:text-smoke">Hacia</span>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {accounts
              .filter((a) => a.id !== accountId)
              .map((a) => {
                const Icon = ACCOUNT_TYPE_ICON[a.type];
                const active = destinationAccountId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setDestinationAccountId(a.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-pills text-body-sm font-medium border shrink-0 ${
                      active
                        ? 'bg-off-black-ink text-electric-lime border-off-black-ink dark:bg-electric-lime dark:text-off-black-ink dark:border-electric-lime'
                        : 'border-ash dark:border-graphite/40 text-graphite dark:text-smoke'
                    }`}
                  >
                    <Icon size={14} />
                    {a.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {type !== 'transfer' && filteredCategories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-graphite dark:text-smoke">Categoría</span>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setCategoryId('')}
              className={`px-3 py-2 rounded-pills text-body-sm font-medium border shrink-0 ${
                categoryId === ''
                  ? 'bg-off-black-ink text-electric-lime border-off-black-ink dark:bg-electric-lime dark:text-off-black-ink dark:border-electric-lime'
                  : 'border-ash dark:border-graphite/40 text-graphite dark:text-smoke'
              }`}
            >
              Sin categoría
            </button>
            {filteredCategories.map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-pills text-body-sm font-medium border shrink-0 ${
                    active
                      ? 'border-off-black-ink dark:border-off-white-canvas text-off-black-ink dark:text-off-white-canvas'
                      : 'border-ash dark:border-graphite/40 text-graphite dark:text-smoke'
                  }`}
                >
                  <span className="w-2 h-2 rounded-pills shrink-0" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-caption font-medium text-graphite dark:text-smoke">Día del mes</span>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
            const active = dayOfMonth === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setDayOfMonth(day)}
                className={`flex items-center justify-center w-9 h-9 rounded-pills text-body-sm font-medium border shrink-0 ${
                  active
                    ? 'bg-off-black-ink text-electric-lime border-off-black-ink dark:bg-electric-lime dark:text-off-black-ink dark:border-electric-lime'
                    : 'border-ash dark:border-graphite/40 text-graphite dark:text-smoke'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-caption font-medium text-graphite dark:text-smoke">
        Nota (opcional)
        <input
          className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2 text-body-sm font-normal text-off-black-ink dark:text-off-white-canvas"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. Sueldo mensual"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-inputs text-graphite dark:text-smoke hover:bg-off-white-canvas dark:hover:bg-graphite/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-5 py-2.5 rounded-buttons bg-electric-lime text-off-black-ink font-medium hover:opacity-90 disabled:opacity-50"
        >
          {editingRecurring ? 'Guardar cambios' : 'Crear recurrente'}
        </button>
      </div>
    </form>
  );
}
