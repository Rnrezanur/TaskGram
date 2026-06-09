create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  content text not null default '',
  color text not null default 'default' check (color in ('default','blue','green','amber','rose')),
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null,
  description text,
  transaction_date date not null default current_date,
  currency text not null default 'BDT' check (length(currency) = 3),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index notes_user_updated_idx on public.notes(user_id, is_archived, is_pinned desc, updated_at desc);
create index finance_user_date_idx on public.finance_transactions(user_id, transaction_date desc);
create index finance_user_type_date_idx on public.finance_transactions(user_id, transaction_type, transaction_date desc);

create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();
create trigger finance_transactions_touch before update on public.finance_transactions for each row execute function public.touch_updated_at();

alter table public.notes enable row level security;
alter table public.finance_transactions enable row level security;

create policy "notes own all" on public.notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "finance own all" on public.finance_transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
