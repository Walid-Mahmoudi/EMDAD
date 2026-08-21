begin;

create or replace view public.crm_project_financials as
select
  p.id as project_id,
  p.project_name,
  p.company_id,
  p.assigned_employee_id,
  p.sales_stage,
  coalesce(p.expected_value,0) as expected_value,
  coalesce(p.probability,0) as probability,
  round(coalesce(p.expected_value,0) * coalesce(p.probability,0) / 100.0, 2) as weighted_value,
  coalesce(p.actual_contract_value,0) as actual_contract_value,
  coalesce(sum(c.required_amount),0) as required_collection,
  coalesce(sum(c.collected_amount),0) as collected_amount,
  greatest(coalesce(sum(c.required_amount),0) - coalesce(sum(c.collected_amount),0),0) as outstanding_amount,
  case when coalesce(sum(c.required_amount),0) > 0 then round(coalesce(sum(c.collected_amount),0) / sum(c.required_amount) * 100.0,2) else 0 end as collection_percentage
from public.projects p
left join public.collections c on c.project_id = p.id
group by p.id;

create or replace view public.crm_employee_performance as
select
  e.id as employee_id,
  e.full_name,
  e.position,
  count(distinct p.id) as projects_count,
  count(distinct p.id) filter (where p.sales_stage not in ('Closed','Lost')) as active_projects,
  count(distinct p.id) filter (where p.sales_stage = 'Won / Contract') as won_projects,
  count(distinct p.id) filter (where p.sales_stage = 'Lost') as lost_projects,
  coalesce(sum(p.expected_value) filter (where p.sales_stage not in ('Closed','Lost')),0) as pipeline_value,
  coalesce(sum(p.expected_value * coalesce(p.probability,0) / 100.0) filter (where p.sales_stage not in ('Closed','Lost')),0) as weighted_pipeline_value,
  coalesce(sum(p.actual_contract_value),0) as contract_value,
  coalesce(sum(c.collected_amount),0) as collected_value,
  greatest(coalesce(sum(c.required_amount),0) - coalesce(sum(c.collected_amount),0),0) as outstanding_value,
  count(a.id) as activities_count,
  count(a.id) filter (where a.status = 'Overdue') as overdue_followups
from public.employees e
left join public.projects p on p.assigned_employee_id = e.id
left join public.collections c on c.project_id = p.id
left join public.activities a on a.employee_id = e.id
group by e.id, e.full_name, e.position;

commit;
