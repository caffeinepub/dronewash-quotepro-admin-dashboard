# Specification

## Summary
**Goal:** Implement an admin-only `resetMaintenanceFund` backend function and wire it to the existing Reset Fund button in the frontend.

**Planned changes:**
- Add a `resetMaintenanceFund` function in `backend/main.mo` that verifies the caller has the admin role, resets the maintenance fund balance, clears or archives maintenance expense entries, and returns a success/error result
- Add a `useResetMaintenanceFund` mutation hook in `frontend/src/hooks/useQueries.ts` that calls the backend function, invalidates relevant queries on success, and shows a success or error toast
- Wire the existing Reset Fund button in the `MaintenanceManagement` component to use the new mutation hook, disabling it for non-admins and showing a loading state while the mutation is in flight

**User-visible outcome:** Admin users can click the Reset Fund button in the Maintenance Management page to reset the maintenance fund balance, receiving a success or error notification; non-admin users see the button disabled.
