# Phase 11 — Live Management Reports

The admin Reports page now consumes the current Supabase reporting layer instead of the obsolete `crm_project_financials` shape.

Sources:
- `projects` for project sales reporting and live weighted values.
- `crm_employee_performance` for employee KPIs.
- `crm_management_activity_report` for activity KPIs.
- `crm_management_collection_report` for collection KPIs.

No KPI values are hard-coded.
