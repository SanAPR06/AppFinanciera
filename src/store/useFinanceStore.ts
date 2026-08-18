import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Account, Category, RecurringTransaction, Transaction, AccountType, TxType } from '../types';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import * as api from '../lib/api';
import { isDueThisMonth, occurrenceDateForThisMonth, currentYm } from '../lib/recurring';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  isLoading: boolean;

  loadRemote: () => Promise<void>;
  resetLocal: () => void;
  runRecurringGeneration: () => Promise<void>;

  addAccount: (input: {
    name: string;
    type: AccountType;
    currency: string;
    initialBalance: number;
  }) => Promise<void>;
  updateAccount: (
    id: string,
    input: { name: string; type: AccountType; currency: string; initialBalance: number }
  ) => Promise<void>;
  archiveAccount: (id: string) => void;
  deleteAccount: (id: string) => Promise<void>;

  addCategory: (input: { name: string; kind: 'income' | 'expense'; color: string }) => void;

  addTransaction: (input: {
    type: TxType;
    amount: number;
    currency: string;
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    note?: string;
    occurredAt: string;
  }) => Promise<void>;
  updateTransaction: (
    id: string,
    input: {
      type: TxType;
      amount: number;
      currency: string;
      accountId: string;
      destinationAccountId?: string;
      categoryId?: string;
      note?: string;
      occurredAt: string;
    }
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addRecurring: (input: {
    type: TxType;
    amount: number;
    currency: string;
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    note?: string;
    dayOfMonth: number;
  }) => Promise<void>;
  updateRecurring: (
    id: string,
    input: {
      type: TxType;
      amount: number;
      currency: string;
      accountId: string;
      destinationAccountId?: string;
      categoryId?: string;
      note?: string;
      dayOfMonth: number;
    }
  ) => Promise<void>;
  toggleRecurringActive: (id: string, isActive: boolean) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
}

const seedCategories: Category[] = [
  { id: uuid(), name: 'Sueldo', kind: 'income', color: '#22c55e' },
  { id: uuid(), name: 'Comida', kind: 'expense', color: '#f97316' },
  { id: uuid(), name: 'Servicios', kind: 'expense', color: '#3b82f6' },
  { id: uuid(), name: 'Transporte', kind: 'expense', color: '#a855f7' },
  { id: uuid(), name: 'Pagos', kind: 'expense', color: '#ec4899' },
  { id: uuid(), name: 'Otros', kind: 'expense', color: '#6b7280' },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      accounts: [],
      categories: seedCategories,
      transactions: [],
      recurringTransactions: [],
      isLoading: false,

      loadRemote: async () => {
        if (!isSupabaseConfigured) return;
        set({ isLoading: true });
        try {
          const { accounts, categories, transactions, recurringTransactions } = await api.fetchAll();
          set({ accounts, categories, transactions, recurringTransactions, isLoading: false });
          await get().runRecurringGeneration();
        } catch (err) {
          console.error('Error cargando datos de Supabase:', err);
          set({ isLoading: false });
        }
      },

      resetLocal: () =>
        set({ accounts: [], categories: seedCategories, transactions: [], recurringTransactions: [] }),

      runRecurringGeneration: async () => {
        const { recurringTransactions } = get();
        const now = new Date();
        for (const r of recurringTransactions) {
          if (!isDueThisMonth(r, now)) continue;
          const occurredAt = occurrenceDateForThisMonth(r, now);
          await get().addTransaction({
            type: r.type,
            amount: r.amount,
            currency: r.currency,
            accountId: r.accountId,
            destinationAccountId: r.destinationAccountId,
            categoryId: r.categoryId,
            note: r.note ? `${r.note} (recurrente)` : 'Recurrente',
            occurredAt,
          });
          const ym = currentYm(now);
          if (isSupabaseConfigured) {
            const updated = await api.updateRecurring(r.id, { lastGeneratedYm: ym });
            set((state) => ({
              recurringTransactions: state.recurringTransactions.map((x) =>
                x.id === r.id ? updated : x
              ),
            }));
          } else {
            set((state) => ({
              recurringTransactions: state.recurringTransactions.map((x) =>
                x.id === r.id ? { ...x, lastGeneratedYm: ym } : x
              ),
            }));
          }
        }
      },

      addAccount: async (input) => {
        if (isSupabaseConfigured) {
          const account = await api.createAccount(input);
          set((state) => ({ accounts: [...state.accounts, account] }));
          return;
        }
        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              id: uuid(),
              ...input,
              isArchived: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      updateAccount: async (id, input) => {
        if (isSupabaseConfigured) {
          const account = await api.updateAccount(id, input);
          set((state) => ({
            accounts: state.accounts.map((a) => (a.id === id ? account : a)),
          }));
          return;
        }
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...input } : a)),
        }));
      },

      archiveAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, isArchived: true } : a
          ),
        })),

      deleteAccount: async (id) => {
        if (isSupabaseConfigured) {
          await api.deleteAccount(id);
        }
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
          transactions: state.transactions.filter(
            (t) => t.accountId !== id && t.destinationAccountId !== id
          ),
        }));
      },

      addCategory: ({ name, kind, color }) =>
        set((state) => ({
          categories: [...state.categories, { id: uuid(), name, kind, color }],
        })),

      addTransaction: async (input) => {
        if (isSupabaseConfigured) {
          const transaction = await api.createTransaction(input);
          set((state) => ({ transactions: [transaction, ...state.transactions] }));
          return;
        }
        set((state) => ({
          transactions: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...input,
            },
            ...state.transactions,
          ],
        }));
      },

      updateTransaction: async (id, input) => {
        if (isSupabaseConfigured) {
          const transaction = await api.updateTransaction(id, input);
          set((state) => ({
            transactions: state.transactions.map((t) => (t.id === id ? transaction : t)),
          }));
          return;
        }
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...input } : t
          ),
        }));
      },

      deleteTransaction: async (id) => {
        if (isSupabaseConfigured) {
          await api.deleteTransaction(id);
        }
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      addRecurring: async (input) => {
        if (isSupabaseConfigured) {
          const recurring = await api.createRecurring(input);
          set((state) => ({ recurringTransactions: [...state.recurringTransactions, recurring] }));
        } else {
          set((state) => ({
            recurringTransactions: [
              ...state.recurringTransactions,
              { id: uuid(), ...input, isActive: true, createdAt: new Date().toISOString() },
            ],
          }));
        }
        await get().runRecurringGeneration();
      },

      updateRecurring: async (id, input) => {
        if (isSupabaseConfigured) {
          const recurring = await api.updateRecurring(id, input);
          set((state) => ({
            recurringTransactions: state.recurringTransactions.map((r) => (r.id === id ? recurring : r)),
          }));
          return;
        }
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) =>
            r.id === id ? { ...r, ...input } : r
          ),
        }));
      },

      toggleRecurringActive: async (id, isActive) => {
        if (isSupabaseConfigured) {
          const recurring = await api.updateRecurring(id, { isActive });
          set((state) => ({
            recurringTransactions: state.recurringTransactions.map((r) => (r.id === id ? recurring : r)),
          }));
          return;
        }
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) =>
            r.id === id ? { ...r, isActive } : r
          ),
        }));
      },

      deleteRecurring: async (id) => {
        if (isSupabaseConfigured) {
          await api.deleteRecurring(id);
        }
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id),
        }));
      },
    }),
    {
      name: 'finanzas-app-storage',
      version: 1,
      partialize: (state) => (isSupabaseConfigured ? {} : state),
      migrate: (persisted) => {
        const state = persisted as FinanceState;
        if (state?.categories && !state.categories.some((c) => c.name === 'Pagos')) {
          state.categories = [
            ...state.categories,
            { id: uuid(), name: 'Pagos', kind: 'expense', color: '#ec4899' },
          ];
        }
        if (!state.recurringTransactions) {
          state.recurringTransactions = [];
        }
        return state;
      },
    }
  )
);
