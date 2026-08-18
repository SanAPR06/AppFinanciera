import { useMemo, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowLeftRight, Landmark, Banknote, CreditCard, Smartphone, PiggyBank, Folder } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useToastStore } from '../store/useToastStore';
import type { Account, Transaction, TxType } from '../types';

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

function toLocalDatetimeInput(isoString: string) {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function isYesterday(iso: string) {
  return new Date(iso).toDateString() === new Date(Date.now() - 86400000).toDateString();
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs' };

export function NewTransactionForm({
  onClose,
  editingTransaction,
}: {
  onClose: () => void;
  editingTransaction?: Transaction;
}) {
  const allAccounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const accounts = useMemo(() => allAccounts.filter((a) => !a.isArchived), [allAccounts]);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const pushToast = useToastStore((s) => s.push);

  const [type, setType] = useState<TxType>(editingTransaction?.type ?? 'expense');
  const [amount, setAmount] = useState(
    editingTransaction ? String(editingTransaction.amount) : ''
  );
  const [accountId, setAccountId] = useState(
    editingTransaction?.accountId ?? accounts[0]?.id ?? ''
  );
  const [destinationAccountId, setDestinationAccountId] = useState(
    editingTransaction?.destinationAccountId ?? ''
  );
  const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId ?? '');
  const [note, setNote] = useState(editingTransaction?.note ?? '');
  const [occurredAt, setOccurredAt] = useState(() =>
    editingTransaction
      ? toLocalDatetimeInput(editingTransaction.occurredAt)
      : new Date().toISOString().slice(0, 16)
  );
  const [showCustomDate, setShowCustomDate] = useState(false);
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
      occurredAt: new Date(occurredAt).toISOString(),
    };
    submittingRef.current = true;
    setIsSubmitting(true);
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
      pushToast('Transacción actualizada', 'success');
    } else {
      await addTransaction(payload);
      pushToast('Transacción guardada', 'success');
    }
    onClose();
  }

  if (accounts.length === 0) {
    return (
      <p className="text-graphite dark:text-smoke">
        Primero crea una cuenta para poder registrar transacciones.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h3 className="text-body-sm font-medium text-graphite dark:text-smoke text-center uppercase tracking-eyebrow">
        {editingTransaction ? 'Editar transacción' : 'Nueva transacción'}
      </h3>

      {/* Selector de tipo */}
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
                active
                  ? 'bg-electric-lime text-off-black-ink'
                  : 'text-graphite dark:text-smoke'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Monto grande */}
      <div className="flex items-center justify-center gap-1 py-2">
        <span className="text-heading font-medium text-graphite dark:text-smoke">
          {currencySymbol}
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          className="w-40 text-heading-lg font-medium text-off-black-ink dark:text-off-white-canvas bg-transparent text-center outline-none tracking-heading-lg tabular-nums"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          required
        />
      </div>

      {/* Cuenta(s) como chips */}
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
            {accounts.length < 2 && (
              <span className="text-caption text-graphite py-2">Crea otra cuenta primero.</span>
            )}
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
                  <span
                    className="w-2 h-2 rounded-pills shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fecha con accesos rápidos */}
      <div className="flex flex-col gap-1.5">
        <span className="text-caption font-medium text-graphite dark:text-smoke">Fecha</span>
        {!showCustomDate ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOccurredAt(new Date().toISOString().slice(0, 16))}
              className={`px-3 py-2 rounded-pills text-body-sm font-medium border ${
                isToday(occurredAt)
                  ? 'bg-off-black-ink text-electric-lime border-off-black-ink dark:bg-electric-lime dark:text-off-black-ink dark:border-electric-lime'
                  : 'border-ash dark:border-graphite/40 text-graphite dark:text-smoke'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() =>
                setOccurredAt(new Date(Date.now() - 86400000).toISOString().slice(0, 16))
              }
              className={`px-3 py-2 rounded-pills text-body-sm font-medium border ${
                isYesterday(occurredAt)
                  ? 'bg-off-black-ink text-electric-lime border-off-black-ink dark:bg-electric-lime dark:text-off-black-ink dark:border-electric-lime'
                  : 'border-ash dark:border-graphite/40 text-graphite dark:text-smoke'
              }`}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => setShowCustomDate(true)}
              className="px-3 py-2 rounded-pills text-body-sm font-medium border border-ash dark:border-graphite/40 text-graphite dark:text-smoke"
            >
              Elegir fecha
            </button>
          </div>
        ) : (
          <input
            type="datetime-local"
            autoFocus
            className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2 text-body-sm"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        )}
      </div>

      <label className="flex flex-col gap-1 text-caption font-medium text-graphite dark:text-smoke">
        Nota (opcional)
        <input
          className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2 text-body-sm font-normal text-off-black-ink dark:text-off-white-canvas"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. Almuerzo con equipo"
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
          {editingTransaction ? 'Guardar cambios' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
