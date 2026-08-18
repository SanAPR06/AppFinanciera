-- Ejecutar en Supabase → SQL Editor

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank','cash','credit_card','digital_wallet','savings','other')),
  currency text not null,
  initial_balance numeric(14,2) not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  color text
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null,
  account_id uuid references accounts(id) on delete cascade,
  destination_account_id uuid references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (
    (type = 'transfer' and destination_account_id is not null and destination_account_id <> account_id)
    or (type <> 'transfer' and destination_account_id is null)
  )
);

create index if not exists idx_transactions_account on transactions(account_id);
create index if not exists idx_transactions_user_date on transactions(user_id, occurred_at desc);

-- Saldo por cuenta calculado en tiempo real
create or replace view account_balances as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.currency,
  a.initial_balance
    + coalesce(sum(case when t.type = 'income' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'expense' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'transfer' and t.account_id = a.id then t.amount else 0 end), 0)
    + coalesce(sum(case when t.type = 'transfer' and t.destination_account_id = a.id then t.amount else 0 end), 0)
    as current_balance
from accounts a
left join transactions t
  on t.account_id = a.id or t.destination_account_id = a.id
group by a.id, a.user_id, a.name, a.currency, a.initial_balance;

-- Seguridad: cada usuario solo ve sus propios datos
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own accounts" on accounts for all using (auth.uid() = user_id);
create policy "own categories" on categories for all using (auth.uid() = user_id);
create policy "own transactions" on transactions for all using (auth.uid() = user_id);

-- Crea el perfil y categorías por defecto automáticamente al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.categories (user_id, name, kind, color) values
    (new.id, 'Sueldo', 'income', '#22c55e'),
    (new.id, 'Comida', 'expense', '#f97316'),
    (new.id, 'Servicios', 'expense', '#3b82f6'),
    (new.id, 'Transporte', 'expense', '#a855f7'),
    (new.id, 'Pagos', 'expense', '#ec4899'),
    (new.id, 'Otros', 'expense', '#6b7280');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Agrega la categoría "Pagos" a usuarios que ya existían antes de este cambio
insert into public.categories (user_id, name, kind, color)
select p.id, 'Pagos', 'expense', '#ec4899'
from public.profiles p
where not exists (
  select 1 from public.categories c where c.user_id = p.id and c.name = 'Pagos'
);
