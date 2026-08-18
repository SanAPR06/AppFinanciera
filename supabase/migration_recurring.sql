-- Ejecutar en Supabase → SQL Editor (después de migration.sql)

create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null,
  account_id uuid references accounts(id) on delete cascade,
  destination_account_id uuid references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  note text,
  day_of_month int not null check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  last_generated_ym text,
  created_at timestamptz not null default now()
);

alter table recurring_transactions enable row level security;
create policy "own recurring transactions" on recurring_transactions for all using (auth.uid() = user_id);
