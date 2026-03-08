# Specification

## Summary
**Goal:** Allow users to specify a custom initial balance when creating a new fund.

**Planned changes:**
- Add an optional "Initial Balance" numeric input field (defaulting to 0) to the CreateFundDialog form, placed after the fund name field.
- Update the backend `createFund` function to accept an optional `initialBalance` parameter; if provided and greater than 0, automatically record an initial inflow transaction for that fund.
- Update the `useCreateFund` mutation hook to pass the optional `initialBalance` value from the form to the backend, re-fetch fund data after creation, and show a success toast.

**User-visible outcome:** When creating a new fund, users can optionally enter a starting balance. If provided, the fund immediately reflects that amount as an inflow transaction upon creation.
