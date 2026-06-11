create table public.task_occurrences (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(reminder_id, due_at)
);

create index task_occurrences_user_due_idx on public.task_occurrences(user_id, due_at desc);
create index task_occurrences_user_status_due_idx on public.task_occurrences(user_id, status, due_at desc);

create trigger task_occurrences_touch before update on public.task_occurrences
for each row execute function public.touch_updated_at();

alter table public.task_occurrences enable row level security;

create policy "task occurrences own select" on public.task_occurrences
for select using (auth.uid() = user_id);

create policy "task occurrences own insert" on public.task_occurrences
for insert with check (auth.uid() = user_id);

create policy "task occurrences own update" on public.task_occurrences
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "task occurrences own delete" on public.task_occurrences
for delete using (auth.uid() = user_id);

create or replace function public.sync_reminder_occurrence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.due_at is distinct from old.due_at then
    insert into public.task_occurrences(reminder_id, user_id, due_at, status, completed_at)
    values (
      new.id,
      new.user_id,
      new.due_at,
      case
        when new.status = 'completed' then 'completed'
        when new.status in ('archived', 'cancelled') then 'cancelled'
        else 'pending'
      end,
      case when new.status = 'completed' then coalesce(new.completed_at, now()) else null end
    )
    on conflict (reminder_id, due_at) do nothing;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'completed' then
      update public.task_occurrences
      set status = 'completed', completed_at = coalesce(new.completed_at, now())
      where reminder_id = new.id and due_at = new.due_at;
    elsif new.status in ('archived', 'cancelled') then
      update public.task_occurrences
      set status = 'cancelled'
      where reminder_id = new.id and due_at = new.due_at and status = 'pending';
    end if;
  end if;

  return new;
end;
$$;

create trigger reminders_sync_occurrence
after insert or update of due_at, status on public.reminders
for each row execute function public.sync_reminder_occurrence();

insert into public.task_occurrences(reminder_id, user_id, due_at, status, completed_at)
select
  id,
  user_id,
  due_at,
  case
    when status = 'completed' then 'completed'
    when status in ('archived', 'cancelled') then 'cancelled'
    else 'pending'
  end,
  completed_at
from public.reminders
on conflict (reminder_id, due_at) do nothing;
