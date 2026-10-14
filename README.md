# 🎟️ TicketLagbe — AI-Verified P2P Secondary Ticket Marketplace

Bangladesh's premier peer-to-peer secondary ticketing platform engineered for secure travel and event ticket exchange. TicketLagbe solves ticket scalping, counterfeit tickets, and payment fraud through **AI-assisted ticket verification**, **cryptographic duplicate detection (SHA-256)**, and an **automated 4-stage neutral escrow system**.

---

## 🚀 Key Highlights & Architecture

- **Next.js 16 (App Router + Turbopack)**: Blazing fast SSR/SSG rendering with server-actions and dynamic routing.
- **PostgreSQL & Prisma ORM**: Strongly-typed schema adhering to the master ER diagram with 19 relational entities.
- **Centralized JWT Authentication**: Double-layered protection via HttpOnly cookie and Bearer header, unified through `lib/auth.ts` and `middleware.ts`.
- **AI-Powered OCR & Hash Engine**: Auto-extracts ticket code, travel dates, origin, destination, and checks duplicate SHA-256 hashes before approval.
- **Multi-Rail Payment Gateway Sandbox**: bKash, Nagad, Rocket, and Debit/Credit Card checkout simulation with HMAC-SHA256 signature verification and automated refund dispatch.
- **4-Stage Neutral Escrow Engine**: `PENDING` ➔ `ESCROW_HOLD` ➔ `CONFIRMED` ➔ `RELEASED` / `REFUNDED` with buyer delivery confirmation and dispute windows.
- **Admin Command Center (`/admin`)**: Real-time platform metrics, user moderation (Activate/Suspend/Ban), AI verification overrides, dispute resolution, and security fraud alerts.
- **Security & Threat Protection**: In-memory sliding-window rate limiting, automated anomaly detection, immutable audit logs, and strict HTTP security headers (CSP, HSTS, X-Frame-Options).
- **SEO & Production Readiness**: Dynamic `sitemap.xml`, crawler-controlled `robots.txt`, rich OpenGraph & Twitter cards, custom branded `not-found.tsx`, `error.tsx`, and Suspense `loading.tsx`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.3.5 (App Router, Turbopack, React 19) |
| **Styling** | Tailwind CSS v4, Lucide React, Glassmorphic UI Design |
| **Database** | PostgreSQL via Prisma ORM 5.x |
| **Authentication** | Jose JWT (`HS256`), BcryptJS Password Hashing, HttpOnly Cookies |
| **Security** | Sliding-window Rate Limiting, Anomaly Fraud Engine, Immutable Audit Ledger |
| **Payments** | Simulated Gateway Rails (bKash, Nagad, Rocket, Cards) + HMAC Webhooks |

---

## 📋 10-Phase Implementation Roadmap

- [x] **Phase 1: Stabilization & Centralized JWT Authentication**
  - Unified token extraction (`auth_token` cookie & `Bearer` header).
  - Synchronized `/api/auth/me`, `/api/auth/login`, `/api/auth/register`, and Next.js middleware route guard.
- [x] **Phase 2: Marketplace Discovery, Search & Trust Badges**
  - Real-time multi-filter ticket catalog (`/tickets`) with category chips, price sliders, and instant debounced search.
  - Interactive favorites bookmarking (`/api/favorites`) and AI verification trust badges.
- [x] **Phase 3: Seller Operations, Profile Settings & 6-Tab Dashboard**
  - Intuitive ticket listing wizard (`/create-listing`) with instant fee calculator and document upload.
  - Multi-tab command center (`/dashboard`) for Listings, Orders, Sales, Favorites, Inquiries, and Identity Profile.
- [x] **Phase 4: Order Lifecycle & 4-Stage Escrow Timeline**
  - Complete checkout flow (`/checkout`) with breakdown of platform escrow protection fees.
  - Dynamic escrow visualizer (`/order/[id]`) with live stage progression and buyer delivery confirmation.
- [x] **Phase 5: Ticket Verification Engine & Duplicate Prevention**
  - Multipart document upload route (`/api/upload`) with strict file type validation (PDF, JPG, PNG).
  - Deterministic duplicate prevention via SHA-256 ticket code hashing and automated fraud alerts.
- [x] **Phase 6: Multi-Rail Payment Gateway Abstraction & Webhook Verification**
  - Unified sandbox processor supporting bKash, Nagad, Rocket, and Card transactions.
  - Secure HMAC webhook endpoint (`/api/payments/webhook`) and automated dispute refund pipeline (`/api/payments/refund`).
- [x] **Phase 7: Comprehensive Admin Command Center (`/admin`)**
  - Unified executive KPI dashboard: Total Volume, Active Escrows, Fraud Flags, and Success Rates.
  - Tabbed administrative workflows: User Moderation, AI Verification Overrides, Escrow Disputes, and Threat Alerts.
- [x] **Phase 8: Real-Time Notifications & Buyer-Seller Inquiry Hub**
  - Interactive bell popover dropdown with live unread badge and instant mark-as-read.
  - Dedicated notification hub (`/notifications`) and contextual direct inquiry messaging modal (`/api/inquiries`).
- [x] **Phase 9: Enterprise Security Hardening & Rate Limiting**
  - Sliding-window rate limiter (`lib/security/rate-limit.ts`) defending against brute-force attacks.
  - Automated fraud detection engine (`lib/security/fraud-detection.ts`) monitoring price anomalies and duplicate flags.
  - Hardened HTTP security headers in `next.config.ts` (CSP, HSTS, Sniff-protection, Referrer policy).
- [x] **Phase 10: Final Polish, SEO & Production Readiness**
  - Dynamic XML sitemap generator (`app/sitemap.ts`) indexing static pages and active ticket listings.
  - Web crawler policy (`app/robots.ts`) allowing public indexing while safeguarding admin and transaction routes.
  - OpenGraph & Twitter Card social previews in `app/layout.tsx`.
  - Branded 404 (`app/not-found.tsx`), runtime error fallback (`app/error.tsx`), and Suspense loader (`app/loading.tsx`).

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ticketlagbe?schema=public"

# Authentication & Security
JWT_SECRET="your-super-secret-jwt-signing-key-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional Payment Webhook Secret
PAYMENT_WEBHOOK_SECRET="your-hmac-webhook-secret-key"
```

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma db push
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Android App

The Android app uses Capacitor to open the hosted TicketLagbe site in an Android WebView. The Next.js server, database, and API routes remain hosted; the app requires an internet connection. This project cannot be exported as a self-contained static app because its routes depend on server-side features.

### Requirements

- Node.js 22 or newer
- Android Studio with the Android SDK installed
- JDK 21

### Add and open the Android project

```bash
npm install
npm run android:add
npm run android:sync
npm run android:open
```

By default, the app opens `https://ticketlagbe.com`. To build against another HTTPS deployment, set `CAPACITOR_SERVER_URL` before syncing:

```powershell
$env:CAPACITOR_SERVER_URL = "https://your-deployment.example"
npm run android:sync
```

Build and run the app from Android Studio. For a release, configure an Android signing key in Android Studio before generating the APK or AAB.

To build and install a locally testable debug APK from the project root:

```powershell
npm run android:sync
Set-Location android
.\gradlew.bat assembleDebug
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

The debug APK is for testing and direct installation only; publish to Google Play with a release-signed APK or AAB.

---

## 🔒 Security Architecture

1. **Escrow Guarantee**: Buyer funds are never transferred directly to the seller upon checkout. Funds are locked in neutral escrow until the buyer confirms ticket validity or the 24-hour verification window elapses without dispute.
2. **Duplicate Prevention**: Every ticket uploaded generates a SHA-256 hash from its canonical ticket identifier and issuer. Secondary listing attempts for identical codes are blocked and trigger an automated fraud flag.
3. **Role-Based Access Control**: Admins, sellers, and buyers are strictly segmented. Administrative routes (`/admin/*`) require verified `ADMIN` or `MODERATOR` role authorization.

---

## 📄 License
This project is proprietary and confidential. Developed for TicketLagbe Technologies.
