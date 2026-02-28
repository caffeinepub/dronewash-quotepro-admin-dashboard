# Specification

## Summary
**Goal:** Add a visible but inert "Reset" button to the MaintenanceManagement component UI, visible only to admin users.

**Planned changes:**
- Add a "Reset" button in the header/controls area of the MaintenanceManagement component, positioned near the existing "Add Maintenance Expense" button
- Style the button with a destructive/warning appearance (red or orange tones) to indicate a dangerous action
- Show the button only when the logged-in user is an admin (matching the existing admin-only button pattern)
- Attach no click handler logic — the button is inert or logs a placeholder console message only

**User-visible outcome:** Admin users will see a red/orange "Reset" button in the MaintenanceManagement section. The button is visible but does nothing when clicked. Non-admin users will not see the button.
