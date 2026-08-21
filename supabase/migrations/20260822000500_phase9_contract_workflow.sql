begin;

-- One active contract record per project; projects may retain their historical contract data.
create unique index if not exists contracts_project_unique on public.contracts(project_id);

-- Contract values must be valid financial amounts.
alter table public.contracts add constraint contracts_value_nonnegative check (contract_value is null or contract_value >= 0);

-- Collection summary for all contracted projects.
create or replace view public.crm_contract_collection_summary as
select
  p.id as project_id,
  p.project_name,
  p.company_id,
  p.assigned_employee_id,
  p.actual_contract_value,
  coalesce(s.required_amount,0) as required_amount,
  coalesce(s.collected_amount,0) as collected_amount,
  coalesce(s.outstanding_amount,0) as outstanding_amount,
  coalesce(s.collection_percentage,0) as collection_percentage,
  coalesce(s.collection_status,'Not Due') as collection_status
from public.projects p
left join public.crm_project_collection_summary s on s.project_id=p.id
where p.sales_stage in ('Won / Contract','Collection','Closed');

commit;
