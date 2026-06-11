alter table public.task_occurrences
add column title text,
add column description text,
add column category text,
add column custom_category text,
add column priority text,
add column timezone text,
add column recurrence_type text;

update public.task_occurrences occurrence
set
  title = reminder.title,
  description = reminder.description,
  category = reminder.category,
  custom_category = reminder.custom_category,
  priority = reminder.priority,
  timezone = reminder.timezone,
  recurrence_type = reminder.recurrence_type
from public.reminders reminder
where reminder.id = occurrence.reminder_id;

alter table public.task_occurrences
alter column title set not null,
alter column category set not null,
alter column priority set not null,
alter column timezone set not null,
alter column recurrence_type set not null,
alter column reminder_id drop not null;

alter table public.task_occurrences
drop constraint task_occurrences_reminder_id_fkey;

alter table public.task_occurrences
add constraint task_occurrences_reminder_id_fkey
foreign key (reminder_id) references public.reminders(id) on delete set null;

create or replace function public.sync_reminder_occurrence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.due_at is distinct from old.due_at then
    insert into public.task_occurrences(
      reminder_id,
      user_id,
      due_at,
      status,
      completed_at,
      title,
      description,
      category,
      custom_category,
      priority,
      timezone,
      recurrence_type
    )
    values (
      new.id,
      new.user_id,
      new.due_at,
      case
        when new.status = 'completed' then 'completed'
        when new.status in ('archived', 'cancelled') then 'cancelled'
        else 'pending'
      end,
      case when new.status = 'completed' then coalesce(new.completed_at, now()) else null end,
      new.title,
      new.description,
      new.category,
      new.custom_category,
      new.priority,
      new.timezone,
      new.recurrence_type
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
