begin;

-- Keep pipeline probability authoritative at database level.
create or replace function public.apply_stage_probability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.sales_stage = 'Lead' then new.probability := 10;
  elsif new.sales_stage = 'Technical / Pricing' then new.probability := 30;
  elsif new.sales_stage in ('Tender','On Hand') then new.probability := 50;
  elsif new.sales_stage = 'Negotiation' then new.probability := 75;
  elsif new.sales_stage = 'Won / Contract' then new.probability := 100;
  elsif new.sales_stage in ('Lost','Closed') then new.probability := 0;
  elsif new.sales_stage = 'Collection' then new.probability := 100;
  end if;
  return new;
end;
$$;

drop trigger if exists projects_apply_stage_probability on public.projects;
create trigger projects_apply_stage_probability
before insert or update of sales_stage on public.projects
for each row execute function public.apply_stage_probability();

-- Maintain a reliable next-follow-up status without requiring client-side jobs.
create or replace function public.refresh_activity_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status not in ('Completed','Cancelled') and new.next_follow_up_date is not null and new.next_follow_up_date < current_date then
    new.status := 'Overdue';
  elsif new.status = 'Overdue' and (new.next_follow_up_date is null or new.next_follow_up_date >= current_date) then
    new.status := 'Planned';
  end if;
  return new;
end;
$$;

drop trigger if exists activities_refresh_status on public.activities;
create trigger activities_refresh_status
before insert or update of status,next_follow_up_date on public.activities
for each row execute function public.refresh_activity_status();

-- Fast global CRM lookup for company/project/contact/contract searches.
create or replace view public.crm_global_search as
select 'company'::text as record_type, c.id as record_id, c.company_name as title, null::uuid as project_id, c.phone as search_value
from public.companies c
union all
select 'project', p.id, p.project_name, p.id, p.contract_number
from public.projects p
union all
select 'contact', c.id, c.contact_name, null::uuid, c.mobile
from public.contacts c
union all
select 'contract', c.id, c.contract_number, c.project_id, c.contract_number
from public.contracts c;

-- Helpful indexes for the global search and daily operations.
create index if not exists idx_companies_phone on public.companies(phone);
create index if not exists idx_contacts_mobile on public.contacts(mobile);
create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_projects_contract_number on public.projects(contract_number);
create index if not exists idx_projects_stage_probability on public.projects(sales_stage, probability);

commit;
