# JobHunt Cleanup Audit Report — STEP 1 (Read-only)

**Generated:** 2026-11-19  
**Auditor:** Antigravity  
**Scope:** `/mobile`, `/admin`, `/backend`, `/docs` (excluding `node_modules`, `.git`, `dist`)

---

## Baseline Checks (Before Any Change)

| Check | Result |
|---|---|
| `npm --prefix mobile run type-check` | ✅ Exit 0, no errors |
| `npm --prefix mobile test` | ✅ 20/20 tests passed (3 test files) |
| `npm --prefix backend run build` | ✅ Exit 0, Prisma generated + tsc succeeded |
| `npm --prefix admin run build` | ✅ Exit 0, 2554 modules, `dist/index.html` produced |

---

## ✅ KEEP (Do Not Delete)

The following are explicitly excluded from deletion per the rules or by dependency analysis:

| Item | Reason |
|---|---|
| `mobile/src/services/mockService.ts` | Used when `USE_MOCK=true`; required by all three test files |
| `mobile/src/services/mockData.ts` | Imported by `mockService.ts` |
| `mobile/tests/*.test.ts` (3 files) | Active test suite (20 tests pass) |
| `mobile/app/(auth)/verify-otp.tsx` | Active auth route; navigation target from `UnifiedAuthScreen` |
| `mobile/app/(auth)/location-permission.tsx` | Active auth route |
| `mobile/app/(auth)/location-picker.tsx` | Active auth route |
| `mobile/app/(auth)/forgot-password.tsx` | Active auth route |
| `mobile/app/(auth)/welcome.tsx` | Active auth route |
| `backend/prisma/schema.prisma` | Prisma schema |
| `backend/prisma/migrations/` | Migration history |
| `backend/prisma/seed.ts` | Seed script wired to `npm run prisma:seed` |
| `backend/scripts/verifyUserDev.ts` | DEV-only OTP bypass, wired to `npm run dev:verify-user` |
| `mobile/app/(app)/design-preview.tsx` | Should be hidden in release (see note below) but keep file |
| `mobile/app/design-preview.tsx` | Should be hidden in release (see note below) but keep file |
| All `.env.example` files | Configuration reference |
| `docs/*.md` (3 files) | Documentation |
| `backend/prisma/dev.db` | Local SQLite (Prisma fallback; 124 KB, ignored by .gitignore) |
| `Job_Hunt_Full_Project.zip` (77 MB) | Manual backup in repo root — NOT a source file, can be deleted separately if desired; not in scope |

> **Design-preview note:** `mobile/app/(app)/design-preview.tsx` and `mobile/app/design-preview.tsx` are reachable from `profile.tsx` (lines 256, 280) and from `app/_layout.tsx` (Stack.Screen configured). They are still used in development. The correct fix for a release build is to gate the navigation link with `if (__DEV__)` in `profile.tsx`, not to delete the file.

---

## 🔴 Candidates for Deletion

### A — Unused Mobile Assets

| # | Path | Type | Evidence | Confidence |
|---|---|---|---|---|
| A1 | `mobile/assets/adaptive-icon.png` | Image (1.9 MB) | `app.json` references `android-icon-foreground.png` for the adaptive icon foreground, not `adaptive-icon.png`. No other source file or config references it. | **High** |
| A2 | `mobile/assets/android-icon-background.png` | Image (17 KB) | Not referenced in `app.json` (only `foregroundImage` and `backgroundColor` string are used). Zero source matches. | **High** |
| A3 | `mobile/assets/android-icon-monochrome.png` | Image (4 KB) | Not referenced in `app.json` or any source file. Zero matches across all `.ts`/`.tsx` files. | **High** |
| A4 | `mobile/assets/logo.png` | Image (1.9 MB) | Referenced only in `src/components/ui/Logo.tsx` line 24 (`require('../../../assets/logo.png')`). The Logo component IS used (UnifiedAuthScreen, profile, index). **However**, `logo.png` is a full 1.9 MB duplicate of `icon.png` (same pixel dimensions). The correct long-term fix is to point Logo to the already-bundled `icon.png`, but that is a code change. Flag as Medium — keep for now until `Logo.tsx` is updated. | **Medium** |

### B — Duplicate / Thin Wrapper Files

| # | Path | Type | Evidence | Confidence |
|---|---|---|---|---|
| B1 | `mobile/src/components/jobs/JobCard.tsx` | 1-line barrel re-export | File contains **exactly one line**: `export * from '../ui/JobCard';` — a passthrough wrapper to `src/components/ui/JobCard.tsx`. Zero files import from the `jobs/` path; every import goes directly through `src/components/ui` or via the `ui/index.ts` barrel. No breakage from removal (it has never been imported). | **High** |
| B2 | `mobile/src/components/ui/Input.tsx` | 1-line barrel re-export | File contains **exactly one line**: `export * from './TextField';` — a passthrough alias for `TextField`. Zero source files import `ui/Input`; all imports use `TextField` directly or via `ui/index.ts`. Not re-exported from `ui/index.ts`. | **High** |

### C — Unused Mobile npm Dependencies

> **Method:** Text-searched all `.ts`/`.tsx` files in `/mobile` (excluding `node_modules`) for each package's import string.  
> Note: Expo native modules may be used only through `app.json` plugins — those are marked accordingly.

| # | Package | Evidence of Non-use | Confidence |
|---|---|---|---|
| C1 | `expo-linear-gradient` | Zero imports of `expo-linear-gradient` or `LinearGradient` anywhere in source. Not listed as a plugin in `app.json`. | **High** |
| C2 | `expo-image-picker` | Zero imports of `expo-image-picker`, `ImagePicker`, `launchImageLibrary`, or `launchCamera`. Profile avatar picker uses a placeholder; no image picker call exists. Not listed in `app.json` plugins. | **High** |
| C3 | `clsx` | Zero imports of `clsx` in any source file. | **High** |
| C4 | `react-native-worklets` | Zero direct imports. This is a **peer dependency of `react-native-reanimated` v4** — the reanimated package declares it as a peer/engine requirement. Removing it without removing reanimated would break the reanimated native module. **Keep.** *(Listed for awareness only — do NOT delete.)* | n/a |
| C5 | `expo-notifications` | The word "Notifications" appears in `notifications.tsx` and `mockService.ts`, but only as a data model concept (notification objects), never as an import of the `expo-notifications` package itself. Zero package imports found. Not listed in `app.json` plugins. The in-app notifications screen fetches notifications from the backend REST API, not from push-notification system calls. | **High** |
| C6 | `vite` (devDep) | Metro/Expo bundler is used for the app. `vite` is listed as a devDependency only to run `vitest` tests (vitest requires vite). Removing it would break `npm run test`. **Keep.** *(Listed for awareness only.)* | n/a |

### D — Unused Admin Assets

| # | Path | Type | Evidence | Confidence |
|---|---|---|---|---|
| D1 | `admin/src/assets/react.svg` | SVG (Vite scaffold leftover) | No import of `react.svg` found in any `.ts`/`.tsx` file in `/admin/src`. This is the default Vite scaffold asset. | **High** |
| D2 | `admin/src/assets/vite.svg` | SVG (Vite scaffold leftover) | Same as above — no import found. | **High** |
| D3 | `admin/src/assets/hero.png` | Image | No import of `hero.png` found in any `.ts`/`.tsx` file in `/admin/src`. | **High** |

### E — Leftover Archive Files at Repo Root

| # | Path | Type | Evidence | Confidence |
|---|---|---|---|---|
| E1 | `backend.zip` | ZIP archive (0 bytes) | Empty file (0 bytes). Not a source file, not referenced anywhere. No value. | **High** |
| E2 | `Job_Hunt_Full_Project.zip` | ZIP archive (77 MB) | Old full-project snapshot. Not referenced by any build script. Significantly inflates repo size. Not a source file or document. | **High** |

### F — Dead Code (console.log / Debug Statements in Shipped Code)

> These are in production paths (not tests or seed scripts). The backend mailer and test scripts have intentional console output and are excluded.

| # | Path | Lines | Evidence | Confidence |
|---|---|---|---|---|
| F1 | `mobile/src/services/realService.ts` | 40, 98, 133 | `console.log('[API DEBUG...]')` statements left in the production API service. Not behind `__DEV__`. | **High** |
| F2 | `mobile/app/(app)/post-job.tsx` | 74, 96 | `console.warn` and `console.log` in the gig-posting handler. | **High** |
| F3 | `mobile/app/(app)/chat/[id].tsx` | 60, 128 | `console.warn('Failed...')` in production chat screen. | **Medium** (warn on catch is acceptable; listed for review) |

### G — Unused Backend Files / Code

After checking all backend route files (`server.ts` registers: auth, jobs, chat, notifications, users, admin, reports), all 8 route files in `/backend/src/routes/` are registered and in use. All utilities (`asyncHandler`, `distance`, `mailer`, `response`) are imported. The `realBackendVerification.ts` test script is wired to `npm run test:real`.

**No backend source files are provably unused.** All appear in active use.

---

## 📋 Summary Table

| Group | # Items | Est. Size Saving |
|---|---|---|
| A — Unused mobile assets | 3 (excluding logo.png) | ~1.96 MB |
| B — Thin wrapper files (mobile) | 2 files | < 1 KB |
| C — Unused mobile npm deps | 3 packages | ~removes from package.json + lockfile; no node_modules size gain on fresh install |
| D — Unused admin assets | 3 files | ~100 KB |
| E — Root archive files | 2 files | ~77.4 MB |
| F — Debug console.log statements | ~5 lines | n/a (code, not size) |

**Total provable disk saving: ~79.5 MB** (mostly from E2 zip file)

---

## Items Intentionally Left Off

The following were investigated but are **not recommended for deletion**:

| Item | Reason Kept |
|---|---|
| `mobile/assets/logo.png` | In use by `Logo.tsx`; removing it requires a code change to point to `icon.png` instead |
| `mobile/app/(app)/design-preview.tsx` | Active screen; reachable from Profile. Gate with `__DEV__` in navigation instead |
| `mobile/app/design-preview.tsx` | Same as above |
| `mobile/app/(app)/saved-jobs.tsx` | Active screen — it IS in the tab layout (`_layout.tsx` line 217) and navigated to from Profile (lines 256, 280) |
| `mobile/src/store/jobStore.ts` (savedJobs state) | Used by map, index, notifications, and job/[id] screens |
| `mobile/src/components/shared/ReportDialog.tsx` | Used by `app/(app)/job/[id].tsx` |
| `mobile/src/components/jobs/FilterSheet.tsx` | Used by `app/(app)/index.tsx` |
| `backend/prisma/dev.db` | Local SQLite for Prisma; in `.gitignore` |
| `react-native-worklets` | Required peer dep of `react-native-reanimated` v4 |
| `vite` (mobile devDep) | Required by `vitest` test runner |
| `expo-notifications` (mobile dep) | Possibly needed as a native peer for future push support; zero JS imports but not conclusively safe to remove without an Expo native build test |
| All backend `console.log` in mailer, seed, and test scripts | Intentional logging in operational code |

> **Note on `expo-notifications`:** With confidence **Medium**, not High. The JS-side is unused, but Expo SDK native build resolution may still require the package to be present for the Android/iOS build graph. Removing it and running `npx expo export --platform android` or an EAS build is the definitive verification step (Step 2 task).

---

## Recommended Step 2 Batches (Pending Your Approval)

If you approve the above, here is the proposed delete order for Step 2:

1. **Batch 1 — Root archive files** (E1, E2): Delete `backend.zip` and `Job_Hunt_Full_Project.zip`. Run all checks.
2. **Batch 2 — Admin scaffold assets** (D1, D2, D3): Delete `react.svg`, `vite.svg`, `hero.png` from `/admin/src/assets/`. Run admin build.
3. **Batch 3 — Unused mobile assets** (A1, A2, A3): Delete `adaptive-icon.png`, `android-icon-background.png`, `android-icon-monochrome.png`. Run `npx expo export --platform android` to confirm no bundler error.
4. **Batch 4 — Thin wrapper files** (B1, B2): Delete `src/components/jobs/JobCard.tsx` and `src/components/ui/Input.tsx`. Run mobile type-check and tests.
5. **Batch 5 — Unused npm dependencies** (C1, C2, C3): `npm uninstall expo-linear-gradient expo-image-picker clsx` in `/mobile`. Run mobile type-check, tests, and expo export.
6. **Batch 6 — Debug console.log** (F1, F2): Remove the 3 `[API DEBUG]` lines from `realService.ts` and the 2 console lines from `post-job.tsx`. Run mobile type-check and tests.

---

*Report generated by STEP 1 — no files have been deleted or modified.*
