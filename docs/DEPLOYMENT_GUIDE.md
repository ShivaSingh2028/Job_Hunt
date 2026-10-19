# 🚀 JobHunt — Cloud Deployment Guide
> Deploy the complete JobHunt 3-tier platform to permanent 24/7 cloud hosting (**Render** for the Backend REST API + **Vercel** for the Web Admin Console).

---

## 📋 Architecture Overview in the Cloud

| Tier | Component | Cloud Provider | Free Tier Available? | URL Format |
|---|---|---|---|---|
| **Tier 1** | **Backend REST API** | [Render.com](https://render.com) | ✅ Yes (Free Web Service) | `https://jobhunt-api.onrender.com/api/v1` |
| **Tier 2** | **Admin Web Console** | [Vercel.com](https://vercel.com) | ✅ Yes (Unlimited Free Hosting) | `https://jobhunt-admin.vercel.app` |
| **Tier 3** | **Mobile App (Android/iOS)** | [Expo EAS](https://expo.dev) | ✅ Yes (Free Cloud Builds) | Installable `.apk` / Expo Go |

---

## 1️⃣ Step 1: Push Your Code to GitHub

Before deploying to Render and Vercel, push your code to your GitHub account:

1. Go to [github.com/new](https://github.com/new) and create a repository named `JobHunt` (Public or Private).
2. Open a terminal in the root `Job_Hunt` folder and run:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/JobHunt.git
   git branch -M main
   git push -u origin main
   ```
*(All 132 files, Prisma schemas, configurations, and assets are already pre-committed and ready).*

---

## 2️⃣ Step 2: Deploy Backend REST API on Render

Render provides free hosting for Node.js web services.

### Option A: 1-Click Blueprint (Fastest)
1. Sign in to [render.com](https://render.com) (sign up with GitHub).
2. On your Render Dashboard, click **New +** ➔ **Blueprint**.
3. Select your `JobHunt` repository.
4. Render will read the [`render.yaml`](../render.yaml) file at the root of your project and configure everything automatically.
5. Click **Apply**.
6. Render will run:
   - `npm install`
   - `npx prisma db push` (initializes database schema)
   - `npm run prisma:seed` (pre-seeds demo accounts and campus gigs)
   - `npm run build` (compiles TypeScript to `dist/`)
   - `npm run start` (starts the server)
7. Once finished, copy your service's live URL (e.g., `https://jobhunt-backend-api.onrender.com`).

### Option B: Manual Setup on Render
If you prefer setting it up manually:
1. Click **New +** ➔ **Web Service**.
2. Connect your `JobHunt` repository.
3. Configure the settings:
   - **Name:** `jobhunt-api`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run render:build`
   - **Start Command:** `npm run start`
   - **Plan:** Free
4. Under **Advanced ➔ Environment Variables**, add:
   - `PORT` = `8080`
   - `DATABASE_URL` = `file:./dev.db`
   - `JWT_SECRET` = `jobhunt_super_secret_jwt_key_2026`
   - `JWT_REFRESH_SECRET` = `jobhunt_super_secret_refresh_key_2026`
5. Click **Create Web Service**.

---

## 3️⃣ Step 3: Deploy Web Admin Console on Vercel

Vercel provides instant global CDN hosting with automatic SSL and SPA client-side routing.

1. Sign in to [vercel.com](https://vercel.com) (sign up with GitHub).
2. Click **Add New...** ➔ **Project**.
3. Import your `JobHunt` repository.
4. Configure the project:
   - **Project Name:** `jobhunt-admin`
   - **Root Directory:** Click **Edit** and select **`admin`**.
   - **Framework Preset:** `Vite` (automatically detected).
   - **Build Command:** `npm run build` (automatically detected).
   - **Output Directory:** `dist` (automatically detected).
5. Expand **Environment Variables** and add:
   - `VITE_USE_MOCK` = `false`
   - `VITE_API_BASE_URL` = `https://<YOUR-RENDER-URL>/api/v1/admin`
     *(Replace `<YOUR-RENDER-URL>` with the live Render URL from Step 2, e.g. `https://jobhunt-backend-api.onrender.com/api/v1/admin`)*
6. Click **Deploy**.
7. In ~30 seconds, your Admin Console will be live at `https://jobhunt-admin.vercel.app`!
   - Client-side routes like `/users`, `/jobs`, `/reports`, and `/logs` work without 404s thanks to the included [`admin/vercel.json`](../admin/vercel.json).

---

## 4️⃣ Step 4: Connect the Mobile App to Cloud Backend

Now that your backend is running 24/7 on Render, point your mobile app to it:

1. Open `mobile/.env` and update the base URL:
   ```env
   EXPO_PUBLIC_USE_MOCK=false
   EXPO_PUBLIC_API_BASE_URL=https://<YOUR-RENDER-URL>/api/v1
   ```
2. Commit and push the update:
   ```bash
   git add mobile/.env
   git commit -m "chore: connect mobile app to live cloud backend"
   git push
   ```

### Running on Physical Phones (Expo Go):
Any student on campus can now run the app on their phone regardless of Wi-Fi network:
```bash
cd mobile
npx expo start
```
Scan the QR code with **Expo Go** on Android. It connects directly to your live cloud database!

### Building a Standalone Android APK (Installable App):
To produce a downloadable `.apk` file that students can install directly without Expo Go:
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in with your free Expo account:
   ```bash
   eas login
   ```
3. Configure the build:
   ```bash
   cd mobile
   eas build:configure
   ```
4. Build the standalone preview APK:
   ```bash
   eas build -p android --profile preview
   ```
5. When complete, EAS provides a QR code and direct download link to your `.apk` file!

---

## 5️⃣ Verification Checklist

- [ ] **Backend Health Check:** Visit `https://<YOUR-RENDER-URL>/api/v1/health` in your browser. You should receive:
  ```json
  { "success": true, "data": { "status": "ONLINE", "service": "JobHunt Unified REST API" }, "error": null }
  ```
- [ ] **Admin Portal:** Log into `https://<YOUR-VERCEL-URL>` using `admin@jobhunt.campus` / `admin123`. Verify the live user directory and campus jobs appear.
- [ ] **Mobile App:** Sign in as `alex@college.edu` / `password123`. Verify campus gigs load from the cloud backend.
