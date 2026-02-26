# Specification

## Summary
**Goal:** Fix the "Backend Connection Failed" error by correcting the canister ID wiring in the frontend so it successfully connects to the deployed DroneWash Motoko backend canister.

**Planned changes:**
- Audit `useActor.ts` and related frontend config files (`canister_ids.json`, `dfx.json`, environment variable resolution) to identify the canister ID mismatch
- Fix the canister ID used in the frontend actor initialization to match the deployed backend Motoko canister ID
- Ensure the "Retry Connection" button successfully establishes the connection without requiring a full page reload

**User-visible outcome:** After login, the "Backend Connection Failed" screen no longer appears and the dashboard loads successfully with data from the backend canister.
