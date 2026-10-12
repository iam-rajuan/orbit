# Daily View — ToDo App (Version 4)

A modern, cross-platform productivity application engineered with **React Native, Expo, React Native Web, TypeScript, and NativeWind**.

Daily View v4 transforms the spreadsheet-based daily productivity workflow into a responsive, high-performance, local-first dashboard for **Mobile (iOS & Android)**, **Desktop Web**, **Tablet**, and **Progressive Web Apps (PWA)**.

---

## ⚡ Key Highlights & Architecture

- **Cross-Platform Foundation**: Single codebase running on Web, Android, iOS, and Tablets.
- **Expo Router Navigation**: Modern file-based routing (`/dashboard`, `/routine`, `/tasks`, `/expenses`, `/calendar`, `/settings`).
- **Local-First Persistence**: Transparent storage layer using **IndexedDB** on modern web browsers and **AsyncStorage** on native devices.
- **Dynamic KPI Calculations**:
  - Daily Routine Habit Progress (`12 / 12 (100%)`)
  - Daily Task Progress (`8 / 15 (53%)`)
  - Daily Expense Aggregation (`৳1,350.00` with Need vs. Want & Payment Method breakdowns)
- **Accurate Reference Seeding**: Seeded with the 12 habits, 15 tasks, and 8 daily expenses from the source spreadsheet.
- **Full Spreadsheet CSV & JSON Support**: Export complete application backups or import multi-day spreadsheet CSVs directly in Settings.
- **PWA Ready**: Web App Manifest (`manifest.json`), service worker offline shell caching (`sw.js`), and responsive layouts.
- **Responsive Experiences**:
  - **Desktop (≥1024px)**: Collapsible sidebar, top date navigator, compact spreadsheet-like tables, fast hover actions.
  - **Tablet (768px–1023px)**: Two-column grid, compact headers, flexible controls.
  - **Mobile (<768px)**: Native bottom tab bar, touch-friendly task & expense cards, bottom modals.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **Expo (SDK 57) + React Native** | Mobile and cross-platform application foundation |
| **React Native Web** | Seamless desktop and mobile browser compatibility |
| **Expo Router** | File-based navigation and nested tab layouts |
| **TypeScript (Strict Mode)** | End-to-end type safety and schema validation |
| **NativeWind + Tailwind CSS** | Utility-first styling configuration across native and web |
| **Zustand** | Lightweight, reactive global state stores |
| **React Hook Form + Zod** | Form validation and schema contracts |
| **Lucide React Native** | Clean, accessible vector icon set |
| **date-fns** | Timezone-safe local calendar arithmetic |
| **IndexedDB & AsyncStorage** | Structured persistent local storage |
| **Jest + ts-jest** | Automated unit and calculation tests |
| **Playwright** | Browser end-to-end workflow verification |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **bun**

### 2. Installation
```bash
# Install all SDK-compatible dependencies
npm install
```

### 3. Running Locally

#### Run on Web (Desktop / Mobile Browser)
```bash
npx expo start --web
```
or:
```bash
npm run web
```
The application will launch on `http://localhost:8081`.

#### Run on Mobile (Expo Go / Emulator)
```bash
# Start the Metro bundler
npx expo start

# For Android Emulator:
npx expo start --android

# For iOS Simulator (macOS only):
npx expo start --ios
```

---

## 🧪 Testing & Validation

### Run Unit & Calculation Tests
```bash
npm test
```
Executes Jest test suites covering:
- Expense total calculations (verifying exact `৳1,350.00`, `৳1,420.00`, and `৳770.00` sums)
- Task completion formulas (`8 / 15 = 53%` and zero-task edge cases)
- 12 Routine habit schedule definitions and day-of-week recurrence
- Local date key normalization avoiding UTC offset shifts
- CSV parser handling multiline quoted records and date sections

### Run TypeScript Typecheck
```bash
npm run typecheck
```

### Run Playwright E2E Tests
```bash
npm run test:e2e
```

---

## 📦 Production Builds & Deployment

### Production Web / PWA Build
Export the static web bundle:
```bash
npm run build:web
```
Outputs static assets into `dist/` ready for hosting on Cloudflare Pages, Netlify, Vercel, or AWS S3.

### Native Android & iOS Builds (via EAS)
The application is pre-configured for Continuous Native Generation (CNG) through Expo:
```bash
# Configure and trigger EAS cloud builds:
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

---

## 📱 PWA Installation vs Native Distribution

| Feature | Web / PWA | Native (Android / iOS) |
|---|---|---|
| **Distribution** | Direct URL access, "Add to Home Screen" | Google Play Store, Apple App Store, APK / IPA |
| **Offline Support** | Service worker application-shell caching (`sw.js`) | Native offline binary bundling |
| **Storage Mechanism** | Browser `IndexedDB` (with localStorage fallback) | SQLite / `@react-native-async-storage` |
| **Push Notifications** | Web Push API (browser dependent) | Expo Notifications & Apple APNs / FCM |

---

## 📄 License
MIT
