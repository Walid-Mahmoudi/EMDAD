begin;

-- Contract/collection guardrails. A project reaching Won/Contract must have a contract value.
alter table public.projects add constraint projects_probability_range check (probability is null or (probability >= 0 and probability <= 100));
alter table public.collections add constraint collections_amounts_nonnegative check (required_amount >= 0 and collected_amount >= 0);
alter table public.collections add constraint collections_collected_not_above_required check (collected_amount <= required_amount);

-- Financial summary used by the Project Workspace and management reporting.
create or replace view public.crm_project_collection_summary as
select
  p.id as project_id,
  coalesce(sum(c.required_amount),0) as required_amount,
  coalesce(sum(c.collected_amount),0) as collected_amount,
  greatest(coalesce(sum(c.required_amount),0)-coalesce(sum(c.collected_amount),0),0) as outstanding_amount,
  case when coalesce(sum(c.required_amount),0)=0 then 0
       else round(coalesce(sum(c.collected_amount),0)/sum(c.required_amount)*100.0,2) end as collection_percentage,
  case
    when coalesce(sum(c.required_amount),0)=0 then 'Not Due'
    when coalesce(sum(c.collected_amount),0) >= sum(c.required_amount) then 'Fully Collected'
    when coalesce(sum(c.collected_amount),0) > 0 then 'Partially Collected'
    when bool_or(c.due_date < current_date) then 'Overdue'
    else 'Due'
  end as collection_status
from public.projects p
left join public.collections c on c.project_id=p.id
group by p.id;

commit;
