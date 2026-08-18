import { Home, Wallet, Receipt, User, Plus } from 'lucide-react';

export type Tab = 'home' | 'accounts' | 'history' | 'profile';

const ITEMS: { tab: Tab; label: string; icon: typeof Home }[] = [
  { tab: 'home', label: 'Inicio', icon: Home },
  { tab: 'accounts', label: 'Cuentas', icon: Wallet },
  { tab: 'history', label: 'Historial', icon: Receipt },
  { tab: 'profile', label: 'Perfil', icon: User },
];

export function BottomNav({
  active,
  onChange,
  onAdd,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  onAdd: () => void;
}) {
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-pure-white dark:bg-deep-charcoal border-t border-ash dark:border-graphite/40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-5xl mx-auto relative flex items-center justify-between px-4 sm:px-8">
        {[left, right].map((group, i) => (
          <div key={i} className="flex flex-1 justify-around">
            {group.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => onChange(item.tab)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 px-3 text-caption ${
                    active === item.tab
                      ? 'text-off-black-ink dark:text-off-white-canvas font-medium'
                      : 'text-graphite dark:text-smoke'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
        <button
          onClick={onAdd}
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-pills bg-electric-lime text-off-black-ink flex items-center justify-center hover:opacity-90"
          title="Nueva transacción"
        >
          <Plus size={26} />
        </button>
      </div>
    </nav>
  );
}
