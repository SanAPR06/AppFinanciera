import { Landmark, Banknote, CreditCard, Smartphone, PiggyBank, Folder, Pencil, X } from 'lucide-react';
import type { Account } from '../types';
import { ACCOUNT_TYPE_LABELS } from '../types';
import { useCountUp } from '../lib/useCountUp';

const TYPE_ICON: Record<Account['type'], typeof Landmark> = {
  bank: Landmark,
  cash: Banknote,
  credit_card: CreditCard,
  digital_wallet: Smartphone,
  savings: PiggyBank,
  other: Folder,
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(amount);
}

export function AccountCard({
  account,
  balance,
  onEdit,
  onDelete,
}: {
  account: Account;
  balance: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isNegative = balance < 0;
  const Icon = TYPE_ICON[account.type];
  const displayedBalance = useCountUp(balance);
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-pills bg-electric-lime flex items-center justify-center shrink-0">
        <Icon size={18} className="text-off-black-ink" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-off-black-ink dark:text-off-white-canvas truncate">{account.name}</p>
        <p className="text-caption text-graphite dark:text-smoke">{ACCOUNT_TYPE_LABELS[account.type]}</p>
      </div>
      <div className="flex flex-col items-end">
        <p
          className={`font-medium tabular-nums ${
            isNegative ? 'text-red-500' : 'text-off-black-ink dark:text-off-white-canvas'
          }`}
        >
          {formatMoney(displayedBalance, account.currency)}
        </p>
        <p className="text-caption text-graphite dark:text-smoke">{account.currency}</p>
      </div>
      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={onEdit}
          className="text-graphite dark:text-smoke hover:text-off-black-ink dark:hover:text-off-white-canvas p-1"
          title="Editar cuenta"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDelete}
          className="text-graphite dark:text-smoke hover:text-red-500 p-1"
          title="Eliminar cuenta"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export { formatMoney };
