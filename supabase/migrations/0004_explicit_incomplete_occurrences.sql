alter table public.task_occurrences
drop constraint task_occurrences_status_check;

alter table public.task_occurrences
add constraint task_occurrences_status_check
check (status in ('pending','completed','incomplete','cancelled'));
