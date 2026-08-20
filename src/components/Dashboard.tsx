import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useToastStore } from '../store/useToastStore';
import { computeAccountBalance, computeTotalsByCurrency } from '../lib/balance';
import { useCountUp } from '../lib/useCountUp';
import { AccountCard, formatMoney } from './AccountCard';
import { Modal } from './Modal';
import { NewAccountForm } from './NewAccountForm';
import { NewTransactionForm } from './NewTransactionForm';
import { TransactionList } from './TransactionList';
import { BottomNav, type Tab } from './BottomNav';
import { ThemeToggle } from './ThemeToggle';
import { CategoryBreakdown } from './CategoryBreakdown';
import { NewRecurringForm } from './NewRecurringForm';
import { RecurringList } from './RecurringList';
import { PullToRefresh } from './PullToRefresh';
import type { Account, RecurringTransaction, Transaction } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/useTheme';
import { APP_VERSION } from '../version';

export function Dashboard() {
  const allAccounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const categories = useFinanceStore((s) => s.categories);
  const deleteAccount = useFinanceStore((s) => s.deleteAccount);
  const loadRemote = useFinanceStore((s) => s.loadRemote);
  const runRecurringGeneration = useFinanceStore((s) => s.runRecurringGeneration);
  const pushToast = useToastStore((s) => s.push);
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | undefined>();

  const accounts = useMemo(() => allAccounts.filter((a) => !a.isArchived), [allAccounts]);

  const totalsByCurrency = useMemo(
    () => computeTotalsByCurrency(accounts, transactions),
    [accounts, transactions]
  );
  const currencies = Object.keys(totalsByCurrency).sort();
  const activeCurrency =
    selectedCurrency && currencies.includes(selectedCurrency) ? selectedCurrency : currencies[0];
  const displayedTotal = useCountUp(activeCurrency ? totalsByCurrency[activeCurrency] : 0);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  function closeAccountForm() {
    setShowAccountForm(false);
    setEditingAccount(undefined);
  }

  function closeTxForm() {
    setShowTxForm(false);
    setEditingTransaction(undefined);
  }

  function closeRecurringForm() {
    setShowRecurringForm(false);
    setEditingRecurring(undefined);
  }

  function handleDeleteAccount(account: Account) {
    const confirmed = window.confirm(
      `¿Eliminar "${account.name}"? Esto también borrará sus transacciones asociadas.`
    );
    if (confirmed) {
      deleteAccount(account.id);
      pushToast('Cuenta eliminada', 'success');
    }
  }

  async function handleRefresh() {
    if (isSupabaseConfigured) {
      await loadRemote();
    } else {
      await runRecurringGeneration();
      await new Promise((r) => setTimeout(r, 400));
    }
    pushToast('Actualizado', 'success');
  }

  return (
    <div
      className="min-h-screen bg-pure-white dark:bg-off-black-ink"
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <div className="px-4 sm:px-6 pt-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="flex items-baseline gap-2 text-heading font-medium text-off-black-ink dark:text-off-white-canvas tracking-heading">
            Mis Finanzas
            <span className="text-caption font-normal text-graphite dark:text-smoke tracking-normal">
              v{APP_VERSION}
            </span>
          </h1>
          {isSupabaseConfigured && (
            <button
              onClick={() => supabase?.auth.signOut()}
              className="text-graphite dark:text-smoke text-body-sm font-medium hover:text-off-black-ink dark:hover:text-off-white-canvas"
            >
              Salir
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-electric-lime rounded-cards p-6 flex flex-col items-center text-center">
          <p className="text-eyebrow uppercase tracking-eyebrow text-off-black-ink/70 font-medium">
            Saldo total
          </p>
          <p className="text-heading-lg font-medium text-off-black-ink mt-1 tracking-heading-lg leading-heading-lg tabular-nums">
            {formatMoney(displayedTotal, activeCurrency ?? 'USD')}
          </p>
          {currencies.length > 1 && (
            <div className="flex gap-1.5 mt-3">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  onClick={() => setSelectedCurrency(currency)}
                  className={`px-3 py-1 rounded-pills text-caption font-medium border ${
                    currency === activeCurrency
                      ? 'bg-off-black-ink text-electric-lime border-off-black-ink'
                      : 'border-off-black-ink/30 text-off-black-ink/70'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowAccountForm(true)}
            className="mt-4 text-body-sm font-medium text-off-black-ink border-b border-off-black-ink hover:opacity-70"
          >
            + Agregar cuenta
          </button>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
      <div key={activeTab} className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 flex flex-col gap-6 animate-tab-fade-in">
        {activeTab === 'home' && (
          <>
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-subheading font-medium text-off-black-ink dark:text-off-white-canvas">
                  Mis cuentas
                </h2>
                {accounts.length > 3 && (
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className="text-body-sm text-graphite dark:text-smoke font-medium hover:text-off-black-ink dark:hover:text-off-white-canvas"
                  >
                    Ver todas
                  </button>
                )}
              </div>
              {accounts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards">
                  <Wallet size={28} className="text-ash dark:text-graphite/60" />
                  <p className="text-graphite text-body-sm">
                    Aún no tienes cuentas. Crea la primera arriba.
                  </p>
                </div>
              ) : (
                <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards px-4 divide-y divide-ash dark:divide-graphite/40">
                  {accounts.slice(0, 3).map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      balance={computeAccountBalance(account, transactions)}
                      onEdit={() => {
                        setEditingAccount(account);
                        setShowAccountForm(true);
                      }}
                      onDelete={() => handleDeleteAccount(account)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-subheading font-medium text-off-black-ink dark:text-off-white-canvas">
                  Transacciones recientes
                </h2>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-body-sm text-graphite dark:text-smoke font-medium hover:text-off-black-ink dark:hover:text-off-white-canvas"
                >
                  Ver todas
                </button>
              </div>
              <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards px-4">
                <TransactionList
                  compact
                  limit={5}
                  onEdit={(t) => {
                    setEditingTransaction(t);
                    setShowTxForm(true);
                  }}
                />
              </div>
            </section>
          </>
        )}

        {activeTab === 'accounts' && (
          <section>
            <h2 className="text-subheading font-medium text-off-black-ink dark:text-off-white-canvas mb-2">
              Mis cuentas
            </h2>
            {accounts.length === 0 ? (
              <p className="text-graphite text-body-sm">
                Aún no tienes cuentas. Crea la primera arriba.
              </p>
            ) : (
              <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards px-4 divide-y divide-ash dark:divide-graphite/40">
                {accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    balance={computeAccountBalance(account, transactions)}
                    onEdit={() => {
                      setEditingAccount(account);
                      setShowAccountForm(true);
                    }}
                    onDelete={() => handleDeleteAccount(account)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'history' && (
          <section>
            <h2 className="text-subheading font-medium text-off-black-ink dark:text-off-white-canvas mb-2">
              Historial
            </h2>
            {activeCurrency && (
              <CategoryBreakdown
                transactions={transactions}
                categories={categories}
                currency={activeCurrency}
              />
            )}
            <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards px-4">
              <TransactionList
                onEdit={(t) => {
                  setEditingTransaction(t);
                  setShowTxForm(true);
                }}
              />
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section>
            <h2 className="text-subheading font-medium text-off-black-ink dark:text-off-white-canvas mb-2">
              Perfil
            </h2>
            <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards p-5 flex flex-col gap-4 mb-4">
              <div>
                <p className="text-eyebrow uppercase tracking-eyebrow text-graphite dark:text-smoke mb-2 font-medium">
                  Apariencia
                </p>
                <ThemeToggle theme={theme} onChange={setTheme} />
              </div>
              {isSupabaseConfigured ? (
                <>
                  <div>
                    <p className="text-eyebrow uppercase tracking-eyebrow text-graphite dark:text-smoke font-medium">
                      Cuenta
                    </p>
                    <p className="text-off-black-ink dark:text-off-white-canvas">{userEmail ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => supabase?.auth.signOut()}
                    className="self-start text-body-sm font-medium text-red-600 border-b border-red-600 hover:opacity-70"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <p className="text-graphite dark:text-smoke text-body-sm">
                  Modo local: tus datos se guardan solo en este dispositivo.
                </p>
              )}
            </div>

            <div className="bg-off-white-canvas dark:bg-deep-charcoal dark:border dark:border-white/5 rounded-cards p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-eyebrow uppercase tracking-eyebrow text-graphite dark:text-smoke font-medium">
                  Transacciones recurrentes
                </p>
                <button
                  onClick={() => setShowRecurringForm(true)}
                  className="text-body-sm text-graphite dark:text-smoke font-medium hover:text-off-black-ink dark:hover:text-off-white-canvas"
                >
                  + Agregar
                </button>
              </div>
              <RecurringList
                onEdit={(r) => {
                  setEditingRecurring(r);
                  setShowRecurringForm(true);
                }}
              />
            </div>
          </section>
        )}
      </div>
      </PullToRefresh>

      {showAccountForm && (
        <Modal onClose={closeAccountForm}>
          <NewAccountForm onClose={closeAccountForm} editingAccount={editingAccount} />
        </Modal>
      )}
      {showTxForm && (
        <Modal onClose={closeTxForm}>
          <NewTransactionForm onClose={closeTxForm} editingTransaction={editingTransaction} />
        </Modal>
      )}
      {showRecurringForm && (
        <Modal onClose={closeRecurringForm}>
          <NewRecurringForm onClose={closeRecurringForm} editingRecurring={editingRecurring} />
        </Modal>
      )}

      <BottomNav active={activeTab} onChange={setActiveTab} onAdd={() => setShowTxForm(true)} />
    </div>
  );
}
