# Specification

## Summary
**Goal:** Fix the Maintenance Fund balance desynchronization between the Dashboard and the Maintenance section so both always display the same value from a single source of truth.

**Planned changes:**
- Audit the backend Motoko actor to ensure the Maintenance Fund balance is computed solely from its transaction history (inflows minus expenses), removing any separate balance variable that can diverge.
- Update the backend to expose a single query for the Maintenance Fund balance derived from the same transaction log used by both the Dashboard and the Maintenance section.
- Remove all hardcoded or stale fallback values (e.g., €72,000 or €72,200) from frontend components and hooks.
- Align React Query cache keys so the Dashboard (FinancialMetrics/KPIWidgets) and MaintenanceManagement both use the same query key for the Maintenance Fund balance.
- Ensure that mutations in MaintenanceManagement (add inflow, add expense, reset) invalidate all related Dashboard query keys so the Dashboard updates automatically without a full page reload.

**User-visible outcome:** After recording any transaction in the Maintenance section, the Maintenance Fund balance on the Dashboard instantly reflects the same updated value, eliminating the discrepancy between the two screens.
