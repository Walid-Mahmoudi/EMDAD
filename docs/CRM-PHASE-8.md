# EMDAD HVAC CRM — Phase 8

## Contract & Collection Guardrails

- Probability is constrained to 0–100.
- Required and collected collection amounts cannot be negative.
- Collected amount cannot exceed required amount.
- `crm_project_collection_summary` provides required, collected, outstanding, percentage, and status from real collection rows.

The view is intended to power project-level financial summaries and management collection reporting without duplicating calculations in the UI.
