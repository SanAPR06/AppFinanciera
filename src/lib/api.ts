import { supabase } from './supabaseClient';
import type { Account, AccountType, Category, RecurringTransaction, Transaction, TxType } from '../types';

function requireClient() {
  if (!supabase) throw new Error('Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as AccountType,
    currency: row.currency as string,
    initialBalance: Number(row.initial_balance),
    isArchived: row.is_archived as boolean,
    createdAt: row.created_at as string,
  };
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    kind: row.kind as 'income' | 'expense',
    color: row.color as string,
  };
}

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as TxType,
    amount: Number(row.amount),
    currency: row.currency as string,
    accountId: row.account_id as string,
    destinationAccountId: (row.destination_account_id as string) ?? undefined,
    categoryId: (row.category_id as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    occurredAt: row.occurred_at as string,
    createdAt: row.created_at as string,
  };
}

function rowToRecurring(row: Record<string, unknown>): RecurringTransaction {
  return {
    id: row.id as string,
    type: row.type as TxType,
    amount: Number(row.amount),
    currency: row.currency as string,
    accountId: row.account_id as string,
    destinationAccountId: (row.destination_account_id as string) ?? undefined,
    categoryId: (row.category_id as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    dayOfMonth: Number(row.day_of_month),
    isActive: row.is_active as boolean,
    lastGeneratedYm: (row.last_generated_ym as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function fetchAll() {
  const client = requireClient();
  const [{ data: userData }, accountsRes, categoriesRes, transactionsRes, recurringRes] = await Promise.all([
    client.auth.getUser(),
    client.from('accounts').select('*').order('created_at'),
    client.from('categories').select('*'),
    client.from('transactions').select('*').order('occurred_at', { ascending: false }),
    client.from('recurring_transactions').select('*').order('created_at'),
  ]);
  if (!userData.user) throw new Error('No autenticado');
  if (accountsRes.error) throw accountsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (transactionsRes.error) throw transactionsRes.error;
  if (recurringRes.error) {
    // No bloquear la sincronización principal si falta la migración de recurrentes
    // (tabla recurring_transactions inexistente, por ejemplo).
    console.warn('No se pudieron cargar las recurrentes:', recurringRes.error);
  }

  return {
    accounts: accountsRes.data.map(rowToAccount),
    categories: categoriesRes.data.map(rowToCategory),
    transactions: transactionsRes.data.map(rowToTransaction),
    recurringTransactions: recurringRes.error ? [] : recurringRes.data.map(rowToRecurring),
  };
}

export async function createAccount(input: {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) throw new Error('No autenticado');

  const { data, error } = await client
    .from('accounts')
    .insert({
      user_id: userData.user.id,
      name: input.name,
      type: input.type,
      currency: input.currency,
      initial_balance: input.initialBalance,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToAccount(data);
}

export async function updateAccount(
  id: string,
  input: { name: string; type: AccountType; currency: string; initialBalance: number }
) {
  const client = requireClient();
  const { data, error } = await client
    .from('accounts')
    .update({
      name: input.name,
      type: input.type,
      currency: input.currency,
      initial_balance: input.initialBalance,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToAccount(data);
}

export async function deleteAccount(id: string) {
  const client = requireClient();
  const { error } = await client.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

export async function createTransaction(input: {
  type: TxType;
  amount: number;
  currency: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  note?: string;
  occurredAt: string;
}) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) throw new Error('No autenticado');

  const { data, error } = await client
    .from('transactions')
    .insert({
      user_id: userData.user.id,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      account_id: input.accountId,
      destination_account_id: input.destinationAccountId ?? null,
      category_id: input.categoryId ?? null,
      note: input.note ?? null,
      occurred_at: input.occurredAt,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToTransaction(data);
}

export async function updateTransaction(
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
) {
  const client = requireClient();
  const { data, error } = await client
    .from('transactions')
    .update({
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      account_id: input.accountId,
      destination_account_id: input.destinationAccountId ?? null,
      category_id: input.categoryId ?? null,
      note: input.note ?? null,
      occurred_at: input.occurredAt,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToTransaction(data);
}

export async function deleteTransaction(id: string) {
  const client = requireClient();
  const { error } = await client.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function createRecurring(input: {
  type: TxType;
  amount: number;
  currency: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  note?: string;
  dayOfMonth: number;
}) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) throw new Error('No autenticado');

  const { data, error } = await client
    .from('recurring_transactions')
    .insert({
      user_id: userData.user.id,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      account_id: input.accountId,
      destination_account_id: input.destinationAccountId ?? null,
      category_id: input.categoryId ?? null,
      note: input.note ?? null,
      day_of_month: input.dayOfMonth,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToRecurring(data);
}

export async function updateRecurring(
  id: string,
  input: Partial<{
    type: TxType;
    amount: number;
    currency: string;
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    note?: string;
    dayOfMonth: number;
    isActive: boolean;
    lastGeneratedYm: string;
  }>
) {
  const client = requireClient();
  const payload: Record<string, unknown> = {};
  if (input.type !== undefined) payload.type = input.type;
  if (input.amount !== undefined) payload.amount = input.amount;
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.accountId !== undefined) payload.account_id = input.accountId;
  if (input.destinationAccountId !== undefined) payload.destination_account_id = input.destinationAccountId;
  if (input.categoryId !== undefined) payload.category_id = input.categoryId;
  if (input.note !== undefined) payload.note = input.note;
  if (input.dayOfMonth !== undefined) payload.day_of_month = input.dayOfMonth;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.lastGeneratedYm !== undefined) payload.last_generated_ym = input.lastGeneratedYm;

  const { data, error } = await client
    .from('recurring_transactions')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToRecurring(data);
}

export async function deleteRecurring(id: string) {
  const client = requireClient();
  const { error } = await client.from('recurring_transactions').delete().eq('id', id);
  if (error) throw error;
}
