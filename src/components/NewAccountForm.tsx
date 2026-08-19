import { useRef, useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useToastStore } from '../store/useToastStore';
import { extractErrorMessage } from '../lib/errorMessage';
import { CURRENCIES, ACCOUNT_TYPE_LABELS, type Account, type AccountType } from '../types';

export function NewAccountForm({
  onClose,
  editingAccount,
}: {
  onClose: () => void;
  editingAccount?: Account;
}) {
  const addAccount = useFinanceStore((s) => s.addAccount);
  const updateAccount = useFinanceStore((s) => s.updateAccount);
  const pushToast = useToastStore((s) => s.push);
  const [name, setName] = useState(editingAccount?.name ?? '');
  const [type, setType] = useState<AccountType>(editingAccount?.type ?? 'bank');
  const [currency, setCurrency] = useState(editingAccount?.currency ?? 'USD');
  const [initialBalance, setInitialBalance] = useState(
    editingAccount ? String(editingAccount.initialBalance) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError('');
    const payload = {
      name: name.trim(),
      type,
      currency,
      initialBalance: Number(initialBalance) || 0,
    };
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, payload);
        pushToast('Cuenta actualizada', 'success');
      } else {
        await addAccount(payload);
        pushToast('Cuenta creada', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar cuenta:', err);
      setError(extractErrorMessage(err));
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-off-black-ink dark:text-off-white-canvas">
        {editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}
      </h3>

      <label className="flex flex-col gap-1 text-sm text-graphite dark:text-smoke">
        Nombre
        <input
          className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Banco A"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-graphite dark:text-smoke">
        Tipo
        <select
          className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
        >
          {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 text-sm text-graphite dark:text-smoke flex-1">
          Moneda
          <select
            className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-graphite dark:text-smoke flex-1">
          Saldo inicial
          <input
            type="number"
            step="0.01"
            placeholder="0"
            className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 mt-2">
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
          className="px-5 py-2.5 rounded-buttons bg-electric-lime text-off-black-ink hover:opacity-90 disabled:opacity-50"
        >
          {editingAccount ? 'Guardar cambios' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
}
