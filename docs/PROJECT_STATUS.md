# JobHunt — Project Status & Roadmap

> 📌 **Working Rule:** This document tracks development milestones, UI phases, and active progress. Update this file at the end of every phase from now on.

---

## 1. What Is Finished

### Backend & Cloud Infrastructure
* **REST API:** Fully operational Express + TypeScript backend with 8 registered route modules (auth, jobs, chat, notifications, users, admin, reports).
* **Database:** Neon Serverless PostgreSQL with complete schema migrations and seed datasets.
* **Email Service:** Brevo HTTPS REST API integration for delivering 6-digit transactional OTP verification codes.
* **Cloud Hosting:** Cloud deployment live on Render (`https://jobhunt-backend-api.onrender.com/api/v1`) with automated wake-up banner on mobile client.
* **DNS Stabilization:** IPv4-first DNS resolution implemented across Node server and Prisma clients to prevent connection hangs on Windows environments.

### Mobile Client (Expo SDK 58 / React Native 0.88)
* **Design System & Theme Tokens:** Standardized 8-pt spacing, radii, elevations, and semantic colors in `mobile/src/theme`, fully integrated with `useTheme()`.
* **Component Library:** Production-grade components in `mobile/src/components/ui` (`Button`, `TextField`, `Card`, `JobCard`, `Chip`, `Avatar`, `Badge`, `Screen`, `KeyboardScreen`, `ModalSheet`, `EmptyState`, `ErrorState`, `Skeleton`).
* **Inter Typography:** Global Inter font family integration (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`) across all screens.
* **Unified Auth Screen:** Dynamic single-screen authentication (`UnifiedAuthScreen.tsx`) supporting instant animated switching between Log in and Sign up, inline validation on blur, keyboard-collapsing brand header, and first-launch onboarding slides.
* **Seeker Home Redesign:** Streamlined header rows, location reverse geocoding with 5 km radius display, removal of "+ Post" button, and map/list toggle.
* **Full-Width Mode Switcher:** Reusable `ModeSwitcher.tsx` component with animated indicator, active across both Seeker and Recruiter home screens.
* **Bottom Tab Bar:** 5 unified tabs with standardized 24px icon sizes, single-line labels, safe area insets, and dynamic mode-specific tabs (Seeker: Home, Chat, My Gigs, Alerts, Profile | Recruiter: Home, Chat, Posts, Alerts, Profile).
* **Gig Posting Bug Fixes:** Handled `MODE_LOCK_SEEKER` / `MODE_LOCK_RECRUITER` checks with informative alert dialogs instead of silent failures.
* **Android Launch & R8 Crash Resolution:** Fixed native splash screen and font initialization crash (`babel.config.js` and `SplashScreen.preventAutoHideAsync()`), and resolved native R8 WorkDatabase startup crash in release builds (`build 69be6ad6`) via `expo-build-properties` with ProGuard keep rules and disabled release minification.
* **Codebase Cleanup:** Completed two-step audit and safe removal of unused assets, dead console logs, and redundant wrapper files on branch `cleanup/remove-unused-code`.
* **Cloud APK Builds:** Standalone preview APKs compiled via EAS, verified on physical hardware, and saved to Desktop (`JobHunt.apk`).

### Admin Dashboard (Vite + React)
* Administrative portal with user management, live gig status tables, dispute reports, action logs, and OpenStreetMap leaflet visualization.

---

## 2. Current Phase of the UI Redesign

* **Current Milestone:** **Phase 7 Completed (Cancellation Strikes & Dynamic Temporary Suspension Alignment)**.
* **Status:** Recruiter cancellation strikes, 3-strike temporary suspension, dynamic clock-based unblocking, login without 403 restriction, and mobile blocked banners/button disabling are fully implemented and verified across live backend and mock services. Physical device APK installation is verified.

---

## 3. What Is In Progress

* **Live Cloud Flow Verification:** Testing user registration, 6-digit OTP verification via Brevo, location permission request, nearby gig viewing within 5 km, and gig creation on physical hardware connecting to the cloud backend.

---

## 4. Open Bugs & Watch Items

| Issue | Severity | Status | Notes |
|---|---|---|---|
| **Android Release R8 WorkDatabase Crash** | High | Resolved in `51ebb77` | R8 stripped `androidx.work.impl.WorkDatabase_Impl` reflective constructor on cold start. Fixed by adding `expo-build-properties` with `enableMinifyInReleaseBuilds: false` and ProGuard `-keep` rules for `androidx.work.**` and `androidx.room.**`. Verified working on hardware. |
| **EAS Patch Version Mismatches** | Low | Non-blocking | `npx expo-doctor` notes minor patch version differences across 11 packages (e.g. expo 58.0.23 vs 58.0.26). All builds and tests pass cleanly without upgrading. |
| **Physical Device Post-Job Verification** | Medium | In Progress | Need user end-to-end confirmation of gig posting and location reverse geocoding on a physical phone using the new APK. |

---

## 5. Next 5 Steps

1. **Perform End-to-End Real Device Flow:** Test user registration/login, OTP verification, location permission request, nearby gig viewing within 5 km, and gig creation.
2. **Gate Developer Previews:** Wrap the `design-preview` screen navigation entry points in `mobile/app/(app)/profile.tsx` inside `__DEV__` conditions so they are hidden in production releases.
3. **Merge Cleanup Branch:** Review and merge branch `cleanup/remove-unused-code` into the `main` branch once physical device verification passes.
4. **Deploy Backend Strike Updates to Render:** Push local commit `0ca4238` to the remote repository so the cloud Render instance has the recruiter cancellation strike transaction.
5. **Admin Dashboard Analytics Integration:** Complete moderation report review and strike audit screen integration on the Vite web admin console.

---

## Related Documentation
* [REST API Endpoint Contract](file:///C:/Users/Shiva%20Singh/OneDrive/Desktop/Job_Hunt/docs/API_CONTRACT.md)
* [Backend Deployment & Schema Handoff](file:///C:/Users/Shiva%20Singh/OneDrive/Desktop/Job_Hunt/docs/BACKEND_HANDOFF.md)
* [Code Audit & Cleanup Log](file:///C:/Users/Shiva%20Singh/OneDrive/Desktop/Job_Hunt/docs/CLEANUP_REPORT.md)
* [Agent Memory & Architecture Guide](file:///C:/Users/Shiva%20Singh/OneDrive/Desktop/Job_Hunt/AGENTS.md)
