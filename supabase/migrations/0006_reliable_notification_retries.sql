alter table public.notification_deliveries
  add column if not exists next_attempt_at timestamptz;

create index if not exists notification_retry_idx
  on public.notification_deliveries(delivery_status, next_attempt_at, scheduled_for)
  where delivery_status in ('pending', 'failed', 'processing');

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
    where (
        nd.delivery_status in ('pending', 'failed')
        or (
          nd.delivery_status = 'processing'
          and nd.updated_at <= now() - interval '5 minutes'
        )
      )
      and nd.scheduled_for <= now()
      and (nd.next_attempt_at is null or nd.next_attempt_at <= now())
      and nd.attempt_count < 12
      and r.status = 'active'
      and r.telegram_enabled
      and p.telegram_notifications_enabled
    order by coalesce(nd.next_attempt_at, nd.scheduled_for) asc
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
