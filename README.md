# 🚀 Jira Daily Worklog & Timesheet App (Mobile & Netlify Ready)

A modern, fast, mobile-first web app to log daily Jira work entries effortlessly from your phone or laptop.

---

## ✨ Features

- **📱 Mobile-First Design**: Optimized for smartphones (iPhone/Android) and desktop with smooth animations and dark glassmorphic UI.
- **⚡ 1-Tap Quick Work Logging**:
  - Quick time chips (`15m`, `30m`, `45m`, `1h`, `2h`, `4h`, `6h`, `8h`).
  - Billable / Non-Billable toggles.
  - Ready-made description templates (Development, Bug fixes, BA Analysis, Standup sync, etc.).
- **⭐ Starred & Frequent Tickets**: Pin your frequent Jira keys (e.g. `AAIB2311-39`, `AT-100`, `NXT260401-138`) for instant 1-click selection.
- **📊 Daily & Weekly Timesheet Tracker**:
  - Live progress bar tracking towards your 8h daily goal.
  - Weekly breakdown (Mon - Sun).
  - Standup text generator (1-click copy formatted standup summary for WhatsApp / Slack / Teams).
- **🔒 Direct Jira Cloud API Integration**:
  - Connects to your Jira Cloud instance (`valleysoft.atlassian.net`).
  - Built-in Netlify Serverless Function proxy (`/api/jira-proxy`) to prevent CORS issues.
  - Secure local storage of credentials and offline logging mode.
- **📲 Installable PWA**: Add directly to your phone's Home Screen like a native app.

---

## 🛠️ How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🌐 How to Deploy on Netlify (Free & Instant)

### Option 1: Git Repository (Recommended)
1. Push this project to GitHub / GitLab.
2. Go to [Netlify](https://app.netlify.com) and click **"Add new site"** -> **"Import an existing project"**.
3. Netlify will automatically detect `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. Click **Deploy Site**!

### Option 2: Drag & Drop (Netlify Drop)
1. Run `npm run build` locally to generate the `dist` folder.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `dist` folder.

---

## 🔑 How to Connect Jira

1. Open the app on your phone or computer.
2. Tap the **Settings** icon (top right).
3. Fill in:
   - **Jira Domain**: e.g. `valleysoft.atlassian.net`
   - **Email**: your Atlassian account email
   - **API Token**: Generated from [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
4. Tap **Test Connection** -> **Save Settings**.
5. You're ready to log work directly to Jira!

---

## 📱 How to Install on your Phone

- **iOS (iPhone/iPad)**: Open the Netlify link in Safari -> Tap **Share** icon -> Tap **"Add to Home Screen"**.
- **Android**: Open the Netlify link in Chrome -> Tap **3 dots menu** -> Tap **"Install app"** or **"Add to Home Screen"**.
