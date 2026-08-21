# Phase 12 — Dashboard QA

The existing `CrmShell` already provides the main admin/employee dashboard surface. The dashboard uses live arrays loaded from Supabase and computes pipeline, weighted value, contract value, collections, overdue activities, and high-value opportunities from database records.

QA focus:
- Admin sees company-wide data through RLS-authorized queries.
- Employee visibility is restricted by database policies.
- Weighted pipeline uses `weighted_value` from projects.
- Collection totals derive from collection transactions.
- Attention counts derive from activities and collections.
- No mock KPI values are introduced.

Follow-up work should migrate the dashboard aggregates to the database reporting views where appropriate and add automated browser verification once a deployable environment is available.
