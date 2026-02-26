# Specification

## Summary
**Goal:** Revert the DroneWash QuotePro frontend to the v44 stable baseline by removing all PDF integration code and undoing canister audit configuration changes.

**Planned changes:**
- Remove the "Attach PDF" icon button and hidden file input from all Quotations Fund transaction rows in `FundsManagement.tsx`
- Delete the `frontend/src/hooks/usePdfAttachments.ts` hook file entirely
- Remove all PDF-related UI and logic from `FundsManagement.tsx` (Attach, View, Download buttons; paperclip/checkmark indicators; calls to `savePdf`, `getPdf`, `deletePdf`, `hasAttachment`)
- Restore `vite.config.ts`, `.env`, and `.env.production` to their v44 state by reverting canister audit changes

**User-visible outcome:** The app returns to the v44 stable state — no PDF-related controls appear on transaction rows in Funds Management, and canister configuration is restored to its pre-audit baseline so the application functions correctly again.
