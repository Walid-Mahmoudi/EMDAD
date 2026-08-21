begin;

-- Project assignment history: preserve every ownership transfer.
create table if not exists public.project_assignment_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  from_employee_id uuid references public.employees(id),
  to_employee_id uuid references public.employees(id),
  changed_by uuid references public.employees(id),
  changed_at timestamptz not null default now(),
  reason text
);
create index if not exists idx_project_assignment_history_project on public.project_assignment_history(project_id, changed_at desc);

create or replace function public.audit_project_assignment()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.assigned_employee_id is not null then
      insert into public.project_assignment_history(project_id,to_employee_id,changed_at,reason)
      values(new.id,new.assigned_employee_id,now(),'Initial assignment');
    end if;
  elsif new.assigned_employee_id is distinct from old.assigned_employee_id then
    insert into public.project_assignment_history(project_id,from_employee_id,to_employee_id,changed_at,reason)
    values(new.id,old.assigned_employee_id,new.assigned_employee_id,now(),'Project reassignment');
  end if;
  return new;
end; $$;

drop trigger if exists projects_assignment_history on public.projects;
create trigger projects_assignment_history
after insert or update of assigned_employee_id on public.projects
for each row execute function public.audit_project_assignment();

-- Explicit notification/attention records, deduplicated by type and target.
create unique index if not exists notifications_active_target_unique
on public.notifications(notification_type, project_id, employee_id)
where is_read = false;

-- Useful project timeline query surface.
create or replace view public.crm_project_timeline as
select a.project_id, a.id as event_id, 'activity'::text as event_type,
       a.activity_date as event_date, a.activity_type as title,
       a.employee_id, a.notes, a.result
from public.activities a
union all
select p.id, p.id, 'project_created', p.created_at, 'Project Created', p.assigned_employee_id, p.notes, null
from public.projects p
union all
select c.project_id, c.id, 'collection', coalesce(c.collection_date,c.due_date), 'Collection', c.employee_id,
       c.notes, c.payment_status
from public.collections c
order by event_date desc;

commit;
