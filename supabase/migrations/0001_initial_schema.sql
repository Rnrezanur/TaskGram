create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  timezone text not null default 'Asia/Dhaka',
  time_format text default '12h' check (time_format in ('12h','24h')),
  default_reminder_minutes integer default 30 check (default_reminder_minutes >= 0),
  telegram_notifications_enabled boolean default true,
  theme text default 'system' check (theme in ('system','light','dark')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  telegram_chat_id bigint unique not null,
  telegram_username text,
  telegram_first_name text,
  is_active boolean default true,
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  last_test_message_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  category text default 'personal' check (category in ('personal','study','work','health','finance','custom')),
  custom_category text,
  priority text default 'medium' check (priority in ('low','medium','high')),
  due_at timestamptz not null,
  timezone text not null,
  reminder_minutes_before integer default 30 check (reminder_minutes_before >= 0),
  telegram_enabled boolean default true,
  recurrence_type text default 'none' check (recurrence_type in ('none','daily','weekly','monthly','custom_days','custom_weeks')),
  recurrence_interval integer check (recurrence_interval is null or recurrence_interval > 0),
  recurrence_end_at timestamptz,
  next_occurrence_at timestamptz,
  status text default 'active' check (status in ('active','completed','archived','cancelled')),
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  delivery_status text default 'pending' check (delivery_status in ('pending','processing','sent','failed','cancelled')),
  attempt_count integer default 0 check (attempt_count >= 0),
  telegram_message_id bigint,
  error_message text,
  snoozed_from_id uuid references public.notification_deliveries(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index notification_unique_pending on public.notification_deliveries(reminder_id, scheduled_for) where delivery_status in ('pending','processing','sent');
create index reminders_user_due_idx on public.reminders(user_id, due_at);
create index reminders_user_status_idx on public.reminders(user_id, status);
create index notification_due_idx on public.notification_deliveries(delivery_status, scheduled_for) where delivery_status in ('pending','failed');
create index notification_user_idx on public.notification_deliveries(user_id, scheduled_for desc);
create index telegram_token_expiry_idx on public.telegram_link_tokens(expires_at) where used_at is null;
create index telegram_chat_lookup_idx on public.telegram_connections(telegram_chat_id) where is_active;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger telegram_connections_touch before update on public.telegram_connections for each row execute function public.touch_updated_at();
create trigger reminders_touch before update on public.reminders for each row execute function public.touch_updated_at();
create trigger notification_deliveries_touch before update on public.notification_deliveries for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.telegram_connections enable row level security;
alter table public.telegram_link_tokens enable row level security;
alter table public.reminders enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "profiles own select" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = id);

create policy "telegram own select" on public.telegram_connections for select using (auth.uid() = user_id);
create policy "telegram own update" on public.telegram_connections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "telegram own delete" on public.telegram_connections for delete using (auth.uid() = user_id);

create policy "tokens own select" on public.telegram_link_tokens for select using (auth.uid() = user_id);
create policy "tokens own insert" on public.telegram_link_tokens for insert with check (auth.uid() = user_id);
create policy "tokens own update" on public.telegram_link_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders own all" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "deliveries own select" on public.notification_deliveries for select using (auth.uid() = user_id);
create policy "deliveries own insert" on public.notification_deliveries for insert with check (auth.uid() = user_id);
create policy "deliveries own update" on public.notification_deliveries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "deliveries own delete" on public.notification_deliveries for delete using (auth.uid() = user_id);

create or replace function public.claim_due_notifications(batch_size integer default 25)
returns setof public.notification_deliveries
language sql
security definer
set search_path = public
as $$
  with due as (
    select nd.id
    from public.notification_deliveries nd
    join public.reminders r on r.id = nd.reminder_id
    join public.profiles p on p.id = nd.user_id
    join public.telegram_connections tc on tc.user_id = nd.user_id and tc.is_active
    where nd.delivery_status in ('pending','failed')
      and nd.scheduled_for <= now()
      and nd.attempt_count < 3
      and r.status = 'active'
      and r.telegram_enabled
      and p.telegram_notifications_enabled
    order by nd.scheduled_for asc
    for update skip locked
    limit batch_size
  )
  update public.notification_deliveries nd
  set delivery_status = 'processing',
      attempt_count = nd.attempt_count + 1,
      updated_at = now()
  from due
  where nd.id = due.id
  returning nd.*;
$$;
