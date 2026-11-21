# JobHunt — Project Memory & Agent Guidelines

## 1. Project Overview & Architecture Stack

JobHunt is a hyperlocal, campus-focused gig marketplace designed for college communities. It connects students who need quick tasks done (Recruiters) with students looking for immediate flexible work (Seekers).

### Technology Stack
* **Mobile Application (`/mobile`):** Expo SDK 58, React Native 0.88, Expo Router v58 (file-based navigation), Zustand state management, Inter font family, React Native Maps, Expo Location, Expo SecureStore.
* **Admin Dashboard (`/admin`):** React 19, Vite 8, Tailwind CSS v3, React Router v6, Leaflet / OpenStreetMap, Recharts.
* **Backend API (`/backend`):** Node.js 20+, Express 4, TypeScript, Prisma ORM 6, WebSocket (Socket.io), Helmet, express-rate-limit.
* **Database:** Neon Serverless PostgreSQL (production cloud database).
* **Email & OTP Delivery:** Brevo (formerly Sendinblue) transactional email via HTTPS REST API (for 6-digit email confirmation codes).

---

## 2. Directory Structure Map

```text
Job_Hunt/
├── mobile/         # Mobile client (Expo SDK 58 / React Native 0.88)
│   ├── app/        # Expo Router screens (index, (auth)/*, (app)/*)
│   ├── assets/     # App icons and splash drawables
│   └── src/        # Design system, theme, state stores, services, hooks
├── admin/          # Moderation and analytics web dashboard (Vite + React)
│   └── src/        # Pages, admin services, mock data, components
├── backend/        # REST API server & database layer
│   ├── prisma/     # schema.prisma, migration history, seed.ts
│   ├── scripts/    # Development utility scripts
│   └── src/        # Express routes, auth middleware, mailer, sockets
└── docs/           # Specifications, contracts, handoffs, and reports
    ├── API_CONTRACT.md       # Canonical REST API endpoint contracts
    ├── BACKEND_HANDOFF.md    # Deployment architecture and database schema
    ├── CLEANUP_REPORT.md     # Code audit and cleanup log
    └── PROJECT_STATUS.md     # Milestone tracking and next steps
```

---

## 3. Core Commands & Environment Configuration

### Execution Commands
* **Backend Development Server:**
  ```bash
  npm --prefix backend run dev
  # Runs tsx watch src/server.ts on http://localhost:8080
  ```
* **Mobile Dev Server (Expo Metro):**
  ```bash
  cd mobile
  npx expo start -c
  # -c clears Metro cache. Press 'a' for Android, 'w' for Web, or scan with Expo Go.
  ```
* **Validation & Type Checks:**
  ```bash
  npm --prefix mobile run type-check   # tsc --noEmit
  npm --prefix backend run build       # prisma generate && tsc
  npm --prefix admin run build         # tsc -b && vite build
  ```
* **Automated Unit & Integration Tests:**
  ```bash
  npm --prefix mobile test             # Vitest test suite (20 tests)
  ```
* **Cloud APK Production Build (EAS):**
  ```bash
  cd mobile
  eas build --platform android --profile preview
  ```

### Environment Variables Overview
* **`mobile/.env`**:
  * `EXPO_PUBLIC_API_BASE_URL`: API gateway URL.
    > ⚠️ **Network Note:** When testing locally with physical devices or Expo Go, this must be set to your computer's local Wi-Fi LAN IP (e.g., `http://10.x.x.x:8080/api/v1`). It changes whenever you change networks. In EAS preview/production builds, it points to the cloud Render URL.
  * `EXPO_PUBLIC_USE_MOCK`: Set to `true` for offline demo mode or `false` for live backend API.
* **`backend/.env`**:
  * `PORT`, `NODE_ENV`, `DATABASE_URL` (Neon PostgreSQL connection string)
  * `JWT_SECRET`, `JWT_REFRESH_SECRET`
  * `EMAIL_PROVIDER` (`brevo` or `smtp`), `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
  * `ADMIN_SECRET`
* **`admin/.env`**:
  * `VITE_API_BASE_URL`, `VITE_USE_MOCK`

---

## 4. Product & Business Logic Rules

1. **Two Job Classifications:**
   * **Short-Term Gigs:** Quick single-session tasks, maximum duration of **5 hours**, same-day or immediate dispatch.
   * **Long-Term Gigs:** Structured multi-week opportunities, roughly **1 to 2 months** duration.
   * **Location Modality:** Either **On-Site** (geotagged) or **Remote**.
2. **Hyperlocal Discovery Filter:**
   * Seekers only see on-site gigs located within a strict **5 km radius** of their current coordinates.
   * Remote gigs have no distance restrictions and are discoverable globally.
3. **Instant First-Come, First-Served Dispatch:**
   * When a seeker taps "Accept" / "Apply" on an open gig, commitment is instantaneous without drawn-out interview cycles.
4. **Own-Gig Restriction:**
   * Nobody can accept their own gig, in either mode. Returns HTTP 400 with code `OWN_JOB`.
5. **Single Active Role with Mode Locking:**
   * Each user account has access to both **Seeker** and **Recruiter** modes.
   * Only **one mode is active** at a time. Switching via `POST /api/v1/users/me/switch-mode` returns HTTP 409:
     * `MODE_LOCK_RECRUITER`: If switching to Seeker while holding active job postings (`OPEN`, `FILLED`), returns HTTP 409 with `pendingItems` array.
     * `MODE_LOCK_SEEKER`: If switching to Recruiter while holding active accepted gigs (`ACCEPTED`, `IN_PROGRESS`), returns HTTP 409 with `pendingItems` array.
6. **Cancellation & Slot Reopening Rules:**
   * **Seeker Cancellation (`POST /api/v1/jobs/:id/cancel-acceptance`):** Decrements `filledCount`, reopens the job status to `OPEN`, notifies the recruiter (`SEEKER_CANCELLED`), and adds 1 strike to the seeker's `cancellationCount`.
   * **Recruiter Cancellation (`DELETE /api/v1/jobs/:id`):** Sets job status to `CANCELLED`, cancels accepted applications (`cancelledAt` recorded), and notifies all accepted seekers (`RECRUITER_CANCELLED`). If the gig had at least one accepted seeker, 1 cancellation strike is added to the recruiter; cancelling an open gig without accepted seekers carries no strike.
7. **Reliability Strikes & Temporary Suspension:**
   * On the **3rd cancellation strike** (seeker or recruiter), the account is automatically suspended for 24 hours (`blockedUntil: Date.now() + 24h`), `cancellationCount` resets to 0, and a `BLOCKED` notification is created.
   * Block status is determined dynamically by comparing `blockedUntil` with the current time.
   * Blocked users can log in normally (HTTP 200) and browse gigs, chats, profile, and notifications, but attempting to accept a gig (`POST /jobs/:id/accept`) or post a gig (`POST /jobs`) returns HTTP 403 `USER_BLOCKED` containing `blockedUntil`.
   * Once `blockedUntil` passes, the user is unblocked automatically without requiring administrator assistance.
8. **Time-Conflict Prevention:**
   * A seeker cannot accept two short-term gigs with overlapping scheduled times on the same date. Returns HTTP 409 with code `TIME_CONFLICT`.
9. **Administration & Moderation:**
   * An **Admin role** exists alongside dispute **reports** (`/reports`) and an **admin action log** (`/admin/actions`) for platform auditability and moderation overrides.
10. **Payment Handling:**
    * Monetary transactions are out of scope for the app runtime; settlement is direct peer-to-peer upon task completion.

For comprehensive payload definitions and response schemas, refer to [API_CONTRACT.md](file:///C:/Users/Shiva%20Singh/OneDrive/Desktop/Job_Hunt/docs/API_CONTRACT.md).

---

## 5. Design System Rules

* **Design Tokens:** All styles must consume tokens from `mobile/src/theme` (`colors`, `typography`, `spacing`, `radii`, `shadows`) via the `useTheme()` hook.
* **Typography:** **Inter font family exclusively** (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`).
* **Zero Hard-Coded Colors:** Do not hard-code hex codes inside UI screens.
* **Component Library:** Always prefer components from `mobile/src/components/ui` (`Button`, `TextField`, `Card`, `JobCard`, `Chip`, `Avatar`, `Badge`, `Screen`, `KeyboardScreen`).

---

## 6. Agent Working Constraints & Rules

1. **Phase-by-Phase Execution:** Work in defined steps. Stop after completing a phase and wait for explicit user confirmation before proceeding.
2. **Preserve Working Code:** Never change, refactor, or reformat working code unless explicitly demanded by the task.
3. **Safe Deletions Only:** Never delete or remove files without first producing a verified audit list and receiving user approval.
4. **Confidentiality:** Never print, log, or store secrets, tokens, database passwords, or OTP codes.
5. **Local Git Only:** Never push commits to any git remote.
6. **Dual Mode Compatibility:** Always keep mock services (`USE_MOCK=true`) fully functional alongside live backend integration.

---

## 7. Known Gotchas & Lessons Learned

* **Render Free Tier Limitations:** Free web instances sleep on inactivity and discard local disk changes on restart. Outbound SMTP ports (465/587) are blocked by cloud firewalls. Always use Neon PostgreSQL for persistent storage and the Brevo HTTPS REST API for email delivery.
* **Brevo Sender Matching:** The `EMAIL_FROM` variable must match an authorized, verified sender address in the Brevo dashboard exactly.
* **Windows IPv6 DNS Hanging:** Node.js on Windows can stall when resolving external Neon database hostnames over IPv6. Keep `dns.setDefaultResultOrder('ipv4first')` in database initialization scripts.
* **Expo SDK 58 / React Native 0.88 New Architecture Startup:**
  * Modifying `Text.defaultProps` or `TextInput.defaultProps` at module load time causes fatal native exceptions on Android.
  * `SplashScreen.preventAutoHideAsync().catch(() => {})` must catch rejections.
  * Root layout must guard rendering with `if (!fontsLoaded && !fontError) return null;` to prevent rendering un-cached typefaces before Inter finishes loading.
  * `app.json` must not contain the legacy root `"splash"` property; splash screen is configured via the `expo-splash-screen` plugin.

---
*Reference documentation: [API_CONTRACT.md](file:///C:/Users/Shiva%20Singh/OneDrive/Desktop/Job_Hunt/docs/API_CONTRACT.md) | [BACKEND_HANDOFF.md](file:///C:/Users/Shiva%20Singh/OneDrive/Desktop/Job_Hunt/docs/BACKEND_HANDOFF.md)*
