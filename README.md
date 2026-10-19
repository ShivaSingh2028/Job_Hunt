# 🎯 JobHunt — Hyperlocal Campus Gig Platform

**JobHunt** is a modern, location-based job and gig platform built specifically for college students to find part-time gigs near campus or post jobs for peers. One student account seamlessly switches between **SEEKER** and **RECRUITER** modes, while a dedicated desktop **ADMIN PANEL** provides moderation, user audit, and incident resolution.

---

## 🏗️ Architecture & Technology Stack

| Platform | Framework & Libraries | Highlights |
|---|---|---|
| **Mobile App (Android / Cross-Platform)** | **Expo (React Native 0.88 + React 19)**<br/>Expo Router (file-based navigation)<br/>Zustand (Global State)<br/>`@expo/vector-icons/Ionicons`<br/>Expo Location, SecureStore, LinearGradient | Modern student-focused UI, dark/light theme, hyper-local 5 km campus zone, animated welcome screens. |
| **Admin Web Panel** | **React 19 + Vite 6 + TypeScript**<br/>Tailwind CSS (Dark mode)<br/>Lucide Icons, React Router v7 | Desktop-first console with KPI stats, user directory, job moderation, reports queue, and audit trail. |
| **Backend REST API** | **Node.js + Express + TypeScript + Prisma ORM + SQLite / PostgreSQL** | Persistent database (`dev.db`), JWT authentication, Haversine 5km filtering, atomic job acceptance transactions, 3-strike cancellation logic, 34 endpoints. |
| **Architecture** | Clean 3-Tier Layered Architecture | Shared live database between Mobile and Admin, toggled seamlessly via `.env`. |

---

## 🚀 Quick Start (One-Click or Manual)

### Option A: VS Code One-Click
1. Open the project folder in VS Code.
2. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on Mac) and select **Tasks: Run Task**.
3. Choose **Start Full Stack (Backend + Admin + Mobile)**.
4. All three services will launch in split terminal panels!

---

### Option B: Manual Command Line

#### 1. Start the Backend REST API (Port 8080)
```bash
cd backend
npm run dev
```
> API will run at `http://localhost:8080/api/v1` (and `http://10.162.68.159:8080/api/v1` for your phone).
> SQLite database `backend/prisma/dev.db` is pre-seeded and ready!

#### 2. Start the Admin Web Console (Port 5173)
```bash
cd admin
npm run dev
```
> Open your browser at `http://localhost:5173`.

#### 3. Start the Mobile App (Port 8081)
```bash
cd mobile
npx expo start
```
> Scan the QR code using the **Expo Go** app on your phone, or press `a` for Android Emulator.

---

## 🔑 Demo Credentials & Accounts

### Mobile App
- **Email:** `alex@college.edu`
- **Password:** `password123`
- Mode: **Seeker** (can switch to Recruiter anytime from header badge)

- **Recruiter Account:**
  - **Email:** `priya@college.edu`
  - **Password:** `password123`
  - Mode: **Recruiter**

### Admin Web Console
- **Email:** `admin@jobhunt.campus`
- **Password:** `admin123`
- Pre-filled automatically on the login screen for instant demo access!

---

## 🔄 Switching Between Real Backend and Mock Layer

Both clients have zero hardcoded endpoints:

### Mobile App (`mobile/.env`):
```env
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_BASE_URL=http://10.162.68.159:8080/api/v1
```

### Admin Panel (`admin/.env`):
```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080/api/v1/admin
```

For the complete API endpoint specifications, payloads, envelopes, and error codes, see:
👉 [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md)

---

## 📋 Business Rules Enforced by the UI

1. **Job Types**:
   - **Short-Term**: Max 5 hours duration enforced at creation, requires start/end time and date, strictly on-site.
   - **Long-Term**: 1-2 months duration, on-site or remote.
2. **5 km Hyperlocal Privacy Zone**:
   - On-site gigs only appear within 5 km of the student's campus location.
   - Approximate distance only is displayed before acceptance (`1.2km away`).
   - The exact campus building and room is unlocked only **after** the seeker accepts the gig.
3. **First-Come, First-Served**:
   - Instant acceptance with zero recruiter approval needed. If filled, immediate feedback is displayed.
4. **Self-Acceptance Prevention**:
   - Students cannot accept gigs they posted.
5. **Conflict Prevention**:
   - Short-term gigs with overlapping hours on the same date cannot be accepted simultaneously.
6. **Cancellation & 3-Strike Rule**:
   - Seekers can cancel acceptance (re-opening the slot for peers).
   - Recruiter can cancel posts (if applicants exist, counts as strike and notifies students; if unclaimed, zero penalty).
   - At 2 strikes: Warning banner displayed.
   - At 3 strikes: Account temporarily blocked for 24 hours. A persistent countdown banner is displayed and accepting/posting is disabled while viewing remains available.
7. **Mode Switching Lock**:
   - Mode switching is permitted ONLY when nothing is pending.
   - If gigs are active or posts unfilled, a dialog enumerates the pending items blocking mode change.
8. **Student Reporting**:
   - Report any gig or student with predefined reasons (`SPAM`, `FRAUD`, `HARASSMENT`, etc.) and descriptions, reviewed in the admin queue.
9. **No In-App Payments**:
   - Clear banner stating *"Payment settled outside the app"* on all gig details.
