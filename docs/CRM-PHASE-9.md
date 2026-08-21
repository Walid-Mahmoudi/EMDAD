# EMDAD HVAC CRM — Phase 9

## Contract Workflow

- A project has at most one active contract record.
- Contract value cannot be negative.
- Contracted project reporting is exposed through `crm_contract_collection_summary`.
- Financial collection metrics remain database-derived from collection transactions.

The UI should use these views for contract and collection summaries rather than hard-coded calculations.
