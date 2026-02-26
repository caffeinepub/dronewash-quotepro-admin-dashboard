# Specification

## Summary
**Goal:** Fix the frontend/backend canister ID synchronization so the DroneWash QuotePro app on IC mainnet correctly connects to the deployed backend canister.

**Planned changes:**
- Audit and fix `frontend/vite.config.ts` to correctly read the backend canister ID from `canister_ids.json` under the `ic` network key, using the exact canister name declared in `dfx.json`, and inject it as the correct `import.meta.env` variable.
- Audit and fix `frontend/src/hooks/useActor.ts` to read the canister ID from the matching environment variable and remove any hardcoded placeholder or fallback that would override the real deployed canister ID.
- Verify that the canister name key in `vite.config.ts` matches the name in `dfx.json` and that `canister_ids.json` contains a valid IC mainnet canister ID with no undefined/empty lookups.
- Remove or correct any stale or incorrect canister ID values in `frontend/.env` or `frontend/.env.production` that could override the dynamically injected value.
- Ensure the "Backend Connection Failed" error screen no longer appears on IC mainnet after the wiring fixes are applied.

**User-visible outcome:** The app loads correctly on IC mainnet without displaying a backend connection error, and the Dashboard or Login page renders successfully with live data from the backend canister.
