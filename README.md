# 🌾 DhaanTrack — Harvester Work, Booking, Billing, Expense & Profit Management System

**DhaanTrack** is a production-grade full-stack web application designed for agricultural paddy harvesting machine contractors and operators. The system operates on an hourly billing model with multi-role access control, persistent work session timers, real-time calculations, automated expense tracking, and Excel reporting.

---

## 🚀 Key Features

### 1. Dual-Role Architecture
- **Admin (Owner)**: Full business control, dashboard analytics, date filters, Gross vs Net profit calculation modes, combined Users & Machines management, contractor tracking, expense auditing, and formula-injection-safe Excel reports.
- **Operator (User)**: Mobile-first installable PWA with a clean light theme, green primary action buttons, persistent live harvest timer, field estimate calculator with GPS support, quick billing calculator (minutes & clock times with midnight-crossing), and customer payment logging. Operators never see contractor rates, contractor payouts, or admin profit metrics.

### 2. Real-Time Persistent Harvest Timer
- Backed by MongoDB server timestamps and accumulated pause intervals.
- Resilient across browser refresh, mobile device lock, tab changes, incoming phone calls, and temporary network disconnections.
- Prevents concurrent active harvesting sessions on the same machine.
- Automatic duration calculation and customer amount computation upon completion.

### 3. Precision Financial Engine
- **Katha to Acre Conversion**: Regional conversion factors (default 32 Katha = 1 Acre, configurable via Master Data).
- **Time Difference Calculator**: Handles same-day and midnight-crossing sessions (e.g., 22:30 to 02:00) with minute-level precision.
- **Gross Profit**: `Total Customer Revenue - Contractor Amount`
- **Net Profit**: `Total Customer Revenue - Contractor Amount - Deducted Expenses`
- **Customer Balances**: `Final Amount - (Advance Amount + Partial Payments)`

### 4. Security & Data Integrity
- **Authentication**: Secure HttpOnly cookies with JWT session management.
- **CSRF Protection**: Double-submit cookie verification for mutation endpoints.
- **Password Hashing**: Bcrypt with salted rounds.
- **Spreadsheet Security**: Strict sanitization of `=`, `+`, `-`, `@` characters in ExcelJS reports to prevent CSV/Formula injection (CWE-1236).
- **Strict Role-Based Field Masking**: Contractor rates and split amounts are stripped at the service layer before operator serialization.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, SWR, Axios, Lucide React, React Hook Form, Zod, Recharts, PWA Manifest |
| **Backend** | Node.js, Express.js (ES Modules), Mongoose, Bcrypt, Jsonwebtoken, Cookie-Parser, Helmet, CORS, Rate-Limit, ExcelJS |
| **Database** | MongoDB (indexed collections for WorkSessions, Users, Machines, Contractors, Expenses, Payments, MasterData, AuditLogs) |
| **Testing** | Vitest (Unit & Integration tests, Supertest), Playwright (End-to-End browser tests) |

---

## 📂 Project Structure

```
DHANTRACK/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Environment, Constants
│   │   ├── controllers/     # Route controllers for all entities
│   │   ├── middlewares/     # Auth, RBAC, CSRF, Validation, Rate Limiting, Error Handling
│   │   ├── models/          # Mongoose models with validation & indexes
│   │   ├── routes/          # Express route definitions
│   │   ├── scripts/         # Admin bootstrap & seed scripts
│   │   ├── services/        # Business logic & calculation service layer
│   │   ├── utils/           # Time calculators, Excel generator, Audit logger, JWT
│   │   ├── app.js           # Express application configuration
│   │   └── server.js        # Server entrypoint
│   ├── tests/               # Vitest unit and API integration tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/              # Icons, PWA Manifest, Logo
│   ├── src/
│   │   ├── api/             # Axios client with CSRF interceptor & SWR config
│   │   ├── components/
│   │   │   ├── admin/       # Profit toggle, Recharts analytics, Modals
│   │   │   ├── common/      # Button, Card, Badge, Modal, DateFilterSelector, Alert
│   │   │   ├── layout/      # AdminLayout, OperatorLayout, ProtectedRoute
│   │   │   └── operator/    # LiveTimer, RecordPaymentModal
│   │   ├── context/         # AuthContext (SWR in-memory session)
│   │   ├── pages/
│   │   │   ├── admin/       # Dashboard, Works, UsersMachines, Detail, Contractors, Expenses, Reports, MasterData
│   │   │   ├── auth/        # LoginPage
│   │   │   └── operator/    # Dashboard, Timer, FieldCalc, QuickCalc, TodayWorks, Payments, Expenses, History, Profile
│   │   ├── App.jsx          # Route hierarchy
│   │   ├── index.css        # Tailwind directives
│   │   └── main.jsx
│   ├── vite.config.js       # Vite config with backend proxy
│   └── package.json
├── tests/
│   └── e2e/                 # Playwright end-to-end browser test suites
├── playwright.config.js
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **MongoDB**: Local MongoDB instance running on port 27017 or MongoDB Atlas connection URI

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository_url>
cd DHANTRACK

# Install root, backend, and frontend dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment Variables

Create `.env` inside `backend/`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/dhaantrack
JWT_SECRET=dhaantrack_secure_jwt_secret_dev_2026_production_must_replace
JWT_EXPIRES_IN=7d
COOKIE_SECRET=dhaantrack_cookie_signature_secret_2026
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
FRONTEND_URL=http://localhost:5173

# Admin Initial Bootstrap Credentials
BOOTSTRAP_ADMIN_USER_ID=admin
BOOTSTRAP_ADMIN_PASSWORD=Admin@DhaanTrack2026
BOOTSTRAP_ADMIN_NAME=Super Admin
BOOTSTRAP_ADMIN_MOBILE=9876543210
```

### 3. Bootstrap Initial Administrator

Run the automated bootstrap script to verify the database and create the initial Admin account and default Master Data:

```bash
npm --prefix backend run seed
```

Default credentials:
- **User ID**: `admin`
- **Password**: `Admin@DhaanTrack2026`

### 4. Running the Development Servers

In terminal 1 (Backend API):
```bash
npm run backend:dev
```
API server runs at `http://localhost:5000`.

In terminal 2 (Frontend React App):
```bash
npm run frontend:dev
```
Frontend runs at `http://localhost:5173`.

---

## 🧪 Automated Testing

### 1. Vitest Unit & API Integration Tests
Executes unit tests for calculation algorithms, Excel formula injection sanitization, and full API lifecycle tests with Supertest:

```bash
npm --prefix backend test
```

### 2. Playwright End-to-End Browser Tests
Executes end-to-end user journeys testing Admin dashboard, user creation, operator timer persistence, and payment workflows:

```bash
npx playwright test
```

---

## 📋 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate and receive HttpOnly cookie & CSRF token
- `POST /api/auth/logout` — Invalidate session and clear cookies
- `GET /api/auth/me` — Get current authenticated user profile
- `POST /api/auth/change-password` — Change password
- `GET /api/auth/csrf-token` — Retrieve CSRF token

### Combined Users & Machines (`/api/users`)
- `GET /api/users/combined` — Combined table with today's hours, revenues, expenses & profits *(Admin)*
- `GET /api/users/:id/details` — User/Machine performance detail view *(Admin)*
- `POST /api/users` — Register new operator *(Admin)*
- `PATCH /api/users/:id` — Update operator details *(Admin)*
- `POST /api/users/:id/reset-password` — Reset operator password *(Admin)*
- `PATCH /api/users/:id/toggle-status` — Disable or activate operator account *(Admin)*

### Harvester Machines (`/api/machines`)
- `GET /api/machines` — List all registered harvesters
- `POST /api/machines` — Add new harvester *(Admin)*
- `PATCH /api/machines/:id` — Update machine rates & contractor links *(Admin)*

### Harvesting Work Sessions (`/api/work-sessions`)
- `GET /api/work-sessions` — List work sessions with filters (Date, Status, Advance, Search)
- `GET /api/work-sessions/active` — Active live timer session with elapsed seconds
- `POST /api/work-sessions` — Create harvesting work booking
- `POST /api/work-sessions/:id/start` — Start harvesting work session
- `POST /api/work-sessions/:id/pause` — Pause harvesting work session
- `POST /api/work-sessions/:id/resume` — Resume harvesting work session
- `POST /api/work-sessions/:id/complete` — Complete session and calculate customer bill
- `POST /api/work-sessions/calc/minutes` — Quick minutes calculation preview
- `POST /api/work-sessions/calc/time` — Quick clock time calculation preview
- `POST /api/work-sessions/calc/field-estimate` — Field estimate preview (Katha/Acre)

### Expenses (`/api/expenses`)
- `GET /api/expenses` — View expenses (Operators see own; Admin sees all)
- `GET /api/expenses/totals` — Daily & monthly expense totals
- `POST /api/expenses` — Record operational expense
- `PATCH /api/expenses/:id` — Update expense

### Customer Payments (`/api/payments`)
- `POST /api/payments` — Record customer payment (Cash, UPI, Bank Transfer)
- `GET /api/payments/session/:workSessionId` — Payment receipts for a session

### Reports & Export (`/api/reports`)
- `GET /api/reports/dashboard` — Executive KPI metrics, quick summaries & charts
- `GET /api/reports/:reportType` — JSON data for 11 report categories
- `GET /api/reports/:reportType/export` — Download Excel workbook with formula-injection security

### Master Data (`/api/master-data`)
- `GET /api/master-data` — Get Katha conversion, machine capacity, categories
- `PATCH /api/master-data` — Update system configuration *(Admin)*

---

## 🔒 Security Documentation

1. **HttpOnly Cookie Authentication**:
   - Authentication tokens are never exposed to browser `localStorage` or `sessionStorage`.
   - Cookies are configured with `HttpOnly`, `SameSite: 'lax'`, and `Path: '/'`.
2. **CSRF Protection**:
   - Double-submit cookie verification (`dhaantrack_csrf` cookie matched against `X-CSRF-Token` request header on all non-safe HTTP methods).
3. **NoSQL Injection & Object-Level Access**:
   - All IDs are cast and validated via Mongoose and Zod.
   - Operators can only create and access work sessions matching their own user ID and assigned machine.
4. **Formula Injection Defense (CWE-1236)**:
   - Exported spreadsheet cells beginning with `=`, `+`, `-`, or `@` are escaped with a leading single quote `'` in `excelExporter.js`.
5. **Rate Limiting**:
   - Strict rate limiter on `/api/auth/login` (20 attempts per 15 minutes) to defeat brute-force credential stuffing.
   - Global rate limiter on `/api/*` (500 requests per 15 minutes).

---

## 🚀 Production Deployment

### Building for Production
```bash
# Build frontend static bundle
npm --prefix frontend run build
```

### Production Checklist
1. Set `NODE_ENV=production` in backend `.env`.
2. Replace `JWT_SECRET` and `COOKIE_SECRET` with 64-character cryptographically random strings.
3. Set `COOKIE_SECURE=true` when hosting over HTTPS.
4. Run backend using PM2 or Docker:
   ```bash
   pm2 start backend/src/server.js --name dhaantrack-api -i max
   ```
5. Use Nginx as a reverse proxy for TLS termination, serving static files from `frontend/dist/` and proxying `/api` to `http://127.0.0.1:5000`.

---

© 2026 DhaanTrack. Built for high-efficiency agricultural operations.
