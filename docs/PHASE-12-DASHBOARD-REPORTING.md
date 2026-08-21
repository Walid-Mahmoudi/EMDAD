# Phase 12 — Dashboard Reporting

Added `crm_dashboard_management_kpis` as the single database-derived source for management dashboard KPI totals.

It calculates project pipeline, weighted pipeline, contract value, collection totals, activity totals, today's follow-ups, overdue follow-ups, and overdue collections from live CRM tables.

No mock values are used. The existing dashboard can consume this view for management KPI cards while detailed lists remain sourced from the underlying tables/views.
