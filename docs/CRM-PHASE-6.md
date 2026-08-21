# EMDAD HVAC CRM — Phase 6

## Project Details Workspace

The project is the central sales opportunity. The workspace should present the complete project context in one place:

- Project/company/contact summary
- Current owner and assignment history
- Sales stage, probability and financial values
- Expected closing date and next follow-up
- Chronological activity/collection timeline
- Contract information
- Collection summary
- Audit and attention indicators

The database already exposes `crm_project_timeline` and assignment history from Phase 5. UI implementation should consume these sources rather than duplicate business calculations in the client.
