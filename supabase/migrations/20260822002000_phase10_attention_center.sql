begin;

create or replace view public.crm_attention_center as
select
  'overdue_followup'::text as attention_type,
  a.id::text as reference_id,
  a.project_id,
  a.employee_id,
  a.next_follow_up_date as attention_date,
  'Overdue follow-up'::text as title,
  a.notes
from public.activities a
where a.next_follow_up_date is not null
  and a.next_follow_up_date < now()
  and coalesce(a.status,'Planned') not in ('Completed','Cancelled')
union all
select
  'today_followup', a.id::text, a.project_id, a.employee_id,
  a.next_follow_up_date, 'Follow-up due today', a.notes
from public.activities a
where a.next_follow_up_date is not null
  and a.next_follow_up_date >= date_trunc('day', now())
  and a.next_follow_up_date < date_trunc('day', now()) + interval '1 day'
  and coalesce(a.status,'Planned') not in ('Completed','Cancelled')
union all
select
  'overdue_collection', c.id::text, c.project_id, c.employee_id,
  c.due_date, 'Overdue collection', c.notes
from public.collections c
where c.due_date is not null
  and c.due_date < current_date
  and coalesce(c.collected_amount,0) < coalesce(c.required_amount,0)
union all
select
  'missing_next_followup', p.id::text, p.id, p.assigned_employee_id,
  p.expected_closing_date, 'Active project has no next follow-up', p.notes
from public.projects p
where p.sales_stage not in ('Won / Contract','Collection','Closed','Lost')
  and not exists (
    select 1 from public.activities a
    where a.project_id=p.id
      and a.next_follow_up_date is not null
      and coalesce(a.status,'Planned') not in ('Completed','Cancelled')
  )
union all
select
  'closing_soon', p.id::text, p.id, p.assigned_employee_id,
  p.expected_closing_date, 'Project closing soon', p.notes
from public.projects p
where p.expected_closing_date is not null
  and p.expected_closing_date between current_date and current_date + interval '14 days'
  and p.sales_stage not in ('Won / Contract','Collection','Closed','Lost')
union all
select
  'high_value_inactive', p.id::text, p.id, p.assigned_employee_id,
  p.expected_closing_date, 'High-value opportunity needs attention', p.notes
from public.projects p
where coalesce(p.expected_value,0) >= 1000000
  and p.sales_stage not in ('Won / Contract','Collection','Closed','Lost')
  and not exists (
    select 1 from public.activities a
    where a.project_id=p.id
      and a.activity_date >= now() - interval '14 days'
      and coalesce(a.status,'Planned') <> 'Cancelled'
  );

create index if not exists idx_activities_next_followup on public.activities(next_follow_up_date, status);
create index if not exists idx_collections_due_status on public.collections(due_date, payment_status);
create index if not exists idx_projects_expected_closing on public.projects(expected_closing_date, sales_stage);

commit;
