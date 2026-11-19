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

---

## ⚙️ Environment Variables, PostgreSQL (Neon) & Email Setup Guide

### 1. PostgreSQL Database Setup with Neon (Free & Persistent)

To ensure users, jobs, and sessions survive server restarts and redeployments, JobHunt uses **PostgreSQL**. A free, persistent PostgreSQL database can be set up in under 2 minutes using **Neon**:

#### Step-by-Step Neon Setup:
1. Navigate to [https://neon.tech](https://neon.tech) and sign up for a free account (using GitHub or Google).
2. Click **Create Project**, name it `jobhunt-db`, and choose your nearest region (e.g., `AWS US East (N. Virginia)` or `AWS Europe (Frankfurt)`).
3. On the Neon dashboard, locate the **Connection Details** card.
4. Select **Prisma** or **PostgreSQL** connection string format. It will look like:
   ```text
   postgresql://username:password@ep-cool-butterfly-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > ⚠️ **Ensure `?sslmode=require` is present at the end of the connection string.** Neon requires encrypted SSL connections.

5. **Set `DATABASE_URL` locally in `backend/.env`**:
   ```env
   DATABASE_URL="postgresql://username:password@ep-cool-butterfly-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
6. **Set `DATABASE_URL` on Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com) > your **jobhunt-backend-api** Web Service.
   - Click **Environment** > **Add Environment Variable**.
   - Key: `DATABASE_URL`
   - Value: `postgresql://username:password@...neon.tech/neondb?sslmode=require`
   - Click **Save Changes**.

7. **Migrations on Every Deploy**:
   - The backend deployment script runs `npm run render:build`, which executes:
     `prisma generate && prisma migrate deploy && tsc`
   - This automatically creates all tables, native enums (`JobType`, `PayUnit`, `JobStatus`, etc.), and composite indexes on Neon without wiping any user data!

---

### 2. PostGIS vs. Composite Lat/Lng Index Feasibility

- **Current Implementation (Recommended)**:
  - We use a composite B-tree index `@@index([locationLat, locationLng])` on both `User` and `Job` models, with Haversine distance calculations computed in TypeScript (`calculateDistanceKm`).
  - **Pros**: 100% native Prisma type safety, zero raw SQL strings, sub-millisecond query execution for campus-level geographic ranges, and seamless cross-platform portability.
- **PostGIS Evaluation**:
  - Neon supports PostGIS out-of-the-box (`CREATE EXTENSION postgis;`).
  - Adding PostGIS would allow `ST_DWithin` and native spatial `geography(Point, 4326)` columns.
  - **Trade-off**: Prisma does not natively support PostGIS spatial types in schema definition files or its typed query builder; all spatial queries would have to be converted to raw `$queryRaw` statements, losing TypeScript schema safety and type generation. Thus, the composite index + Haversine formula is the optimal, robust architecture for JobHunt.

---

### 3. Email Delivery Switch (SMTP vs. HTTPS API for Cloud Hosts)

Cloud providers such as Render, AWS EC2, and DigitalOcean frequently block outbound connections on standard SMTP ports (`25`, `465`, `587`) on free/standard plans. JobHunt solves this by offering an automatic provider switch:

| Variable | Purpose | Supported Values |
|---|---|---|
| `EMAIL_PROVIDER` | Email transport driver | `smtp` (default), `resend`, `brevo` |
| `RESEND_API_KEY` | Resend HTTPS API Key | String starting with `re_` (uses Port 443 HTTPS) |
| `RESEND_FROM` | Resend Sender Address | e.g. `JobHunt <onboarding@resend.dev>` or custom domain |
| `BREVO_API_KEY` | Brevo HTTPS API Key | String starting with `xkeysib-` (uses Port 443 HTTPS) |
| `BREVO_SENDER` | Brevo Sender Address | Verified email in Brevo |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` or `465` |
| `SMTP_USER` | SMTP username | Sender email address |
| `SMTP_PASS` | SMTP password | 16-character App Password |
| `SMTP_FROM` | SMTP display header | e.g. `JobHunt <you@gmail.com>` |
| `SMTP_SECURE`| SSL flag | `false` (for 587) or `true` (for 465) |

#### How to get a Free Resend API Key (Recommended for Render):
1. Sign up at [https://resend.com](https://resend.com).
2. Go to **API Keys** > Click **Create API Key**.
3. Copy the key (`re_...`) and paste it as `RESEND_API_KEY` in Render and `backend/.env`.
4. Set `EMAIL_PROVIDER=resend`. Resend delivers over HTTPS on port 443 and will never be blocked by cloud firewalls!

#### How to get a Free Brevo API Key:
1. Sign up at [https://brevo.com](https://brevo.com).
2. Click on your profile menu in the top right > **SMTP & API Keys**.
3. Under the **API Keys** tab, click **Generate a new API key**.
4. Set `EMAIL_PROVIDER=brevo` and set `BREVO_API_KEY`.

#### Security & Delivery Guarantees:
- **Hashed OTPs**: OTP codes are salted and hashed with `bcrypt` (10 rounds) before being saved. Plaintext OTPs are never stored in the database.
- **Strict Delivery Verification**: If email delivery fails, the backend returns HTTP `503 EMAIL_SEND_FAILED` with the underlying reason. It never falsely claims an email was dispatched when it was not.
- **DEV-ONLY Console Log**: When running in development (`NODE_ENV !== 'production'`), if email delivery fails, the OTP is printed to the backend terminal clearly labeled `[DEV ONLY]` to accelerate local testing. In production, this output is strictly disabled.
- **Brevo Verified Sender Requirement**: When using `EMAIL_PROVIDER=brevo`, `EMAIL_FROM` (or `BREVO_SENDER`) must match an active verified sender under **Brevo > Senders, Domains & Dedicated IPs > Senders**; otherwise Brevo accepts the API call (`201`) and rejects delivery asynchronously in **Transactional > Logs**.

#### DEV-ONLY Manual Verification Helper (If Email Delivery Is Delayed):
To manually mark a test user as verified in development without waiting for email delivery (strictly refuses to run if `NODE_ENV=production`):
```bash
cd backend
npm run dev:verify-user -- testuser@gmail.com
```

---

### 4. Cold Start Handling on Render Free Tier

Render's free web services spin down after 15 minutes of inactivity. When a request arrives, the server takes ~30–50 seconds to boot up. The JobHunt mobile app handles this seamlessly:
- **Extended Timeout**: Request timeouts are set to **45 seconds** (`45000ms`), with automatic retry on cold start failures.
- **User Feedback**: If the server takes longer than 2.5 seconds to reply, a non-intrusive floating banner appears at the top:
  `⏳ Waking up the server... Please wait a moment.`
- **Session Preservation**: Timeouts, network interruptions, and 5xx errors **never** log the user out. The session is only cleared when the server explicitly returns HTTP `401 Unauthorized` on a confirmed refresh attempt.

---

### 2. How to Create a Gmail App Password for OTP Emails

To allow the backend to send real 6-digit verification emails via Gmail SMTP, you must generate a **Google App Password**:

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Under "How you sign in to Google", ensure **2-Step Verification** is turned **ON**.
3. In the search bar at the top of the Google Account page, search for **"App Passwords"** (or navigate to `https://myaccount.google.com/apppasswords`).
4. Under **App name**, enter `JobHunt` and click **Create**.
5. Google will display a 16-character passcode (formatted like `abcd efgh ijkl mnop`).
6. Copy this 16-character code (spaces can be omitted) and paste it as `SMTP_PASS`.

---

### 3. Setting Environment Variables

#### Locally (`backend/.env`):
Add the lines to `backend/.env`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="JobHunt <your-email@gmail.com>"
```

#### On Render Dashboard:
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Select your **jobhunt-backend-api** Web Service.
3. Click on the **Environment** tab on the left sidebar.
4. Click **Add Environment Variable** for each of:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = `your-16-char-app-password`
   - `SMTP_FROM` = `JobHunt <your-email@gmail.com>`
   - `JWT_SECRET` = `jobhunt_super_secure_jwt_secret_key_2026`
   - `JWT_REFRESH_SECRET` = `jobhunt_super_secure_refresh_secret_key_2026`
   - `ACCESS_TOKEN_EXPIRY` = `15m`
   - `REFRESH_TOKEN_EXPIRY` = `30d`
5. Click **Save Changes**. Render will automatically redeploy with active real email delivery!
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
