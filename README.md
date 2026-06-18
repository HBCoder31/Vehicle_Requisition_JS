# 🚗 Vehicle Requisition Portal

A modern, secure, and feature-rich enterprise-grade web application for managing vehicle requisitions, driver assignments, fuel tracking, maintenance, and multi-level approval workflows.

---

## 🌟 Key Features

### 🏢 Workflows & Role-based Access
- **Multi-Level Approval Workflow** — Role-based authorization chain: Employee ➔ HOD ➔ GMHR ➔ COO (required for out-of-region or special travel requests).
- **Interactive Dashboards** — Tailored portals for **Employee**, **HOD (Head of Department)**, **GMHR (General Manager HR)**, **COO (Chief Operating Officer)**, **Garage Manager**, and **System Administrator**.
- **Real-Time Notifications** — Live status updates and logs fed instantly using lightweight **Server-Sent Events (SSE)**.
- **Authority Delegation** — Employees and managers can temporarily delegate approval authorities to other peers.

### 🔧 Fleet & Operational Management
- **Vehicle Fleet Management** — Comprehensive tracking from requisition, vehicle & driver assignment, trip pickup, in-transit telemetry updates, drop-off, to final completion.
- **Maintenance & Fuel Logs** — Dedicated modules in the Garage portal for tracking scheduled maintenance operations, service costs, and fuel receipts.
- **Destination & Region Configurator** — Dynamic mapping of travel regions, standard destinations, and mileage/travel profiles.

### 📊 Reports & Data Utilities
- **Audit Logging** — Secure, immutable event log recording all actions, actor identities, IP addresses, and payload snapshots.
- **Format-Rich Exports** — One-click report downloads supporting **Microsoft Excel (.xlsx)** via SheetJS, **PDF Reports** via jsPDF, and **CSV (with UTF-8 BOM compatibility)**.
- **Smart Printing Layouts** — Optimized landscape print layouts (`@media print`) that remove sidebars/buttons and format clean physical copies of request histories and audit trails.

### 🎨 Premium UI/UX & Micro-Animations
- **Ambient Floating Login** — Smooth CSS-driven organic gradients and floating glassmorphic container blobs on login.
- **Border Beam Glow** — CSS variable border gradients paired with rotating mask animations outlining active cards or focused input boxes.
- **Spring-Physics Modals** — Fast spring cubic-bezier scaling animations for confirmation alerts.
- **Skeleton Shimmer Screens** — Reusable, high-fidelity loading placeholder skeletons running for a minimum of 2 seconds (`DashboardSkeleton.jsx`) to simulate premium cloud data fetching.
- **Staggered Card Transitions** — Delayed component fade-ins providing smooth entrance animations.

---

## 🛠️ Technology Stack

### Frontend
- **React 19** & **Vite 6** — Ultra-fast modular SPA build tool.
- **Tailwind CSS v4** — Utility-first styling with modern inline theme declarations (`@theme`, `@import`, native variable overrides).
- **React Router v7** — Lightweight component-based path routing.
- **Lucide React** — Premium, consistent vector icon system.
- **SheetJS (xlsx)** & **jsPDF** — Dynamic client-side document compilers loaded securely via CDN.

### Backend
- **Node.js** & **Express.js** — Fast, asynchronous web server framework.
- **Passport.js & JWT** — Seamless, secure Google OAuth 2.0 single sign-on backed by signed HTTP-only cookies.
- **Security Middlewares** — Rate-limiting (`express-rate-limit`) and header security injection (`helmet`).
- **Nodemailer** — Standardized dispatch handler for email alerts on requisition approvals/assignments.

### Database
- **MySQL 8.0+** — Structured database utilizing connection pooling via `mysql2`.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Google Cloud Console OAuth 2.0 Credentials (Client ID & Client Secret)

### 1. Database Setup
Create your local database, then seed the tables and demo configurations:
```bash
mysql -u root -p < server/schema.sql
mysql -u root -p < server/seed.sql
```

### 2. Backend Environment Config
Navigate to the server directory, create your environment variables, and install dependencies:
```bash
cd server
cp .env.example .env
```
Update `.env` with your actual MySQL database credentials and Google OAuth details:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=yourpassword
DB_NAME=vehicle_requisition
SESSION_SECRET=yoursecret
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
CLIENT_URL=http://localhost:5173
```
Install and run the dev server:
```bash
npm install
npm run dev
```

### 3. Frontend Config
Navigate to the client directory, install dependencies, and launch:
```bash
cd ../client
npm install
npm run dev
```

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## 👥 Default Test Accounts
For local development and testing, assign your real active Gmail addresses inside `server/seed.sql` to test corresponding roles:
- **Administrator**: `admin@example.com`
- **Chief Operating Officer (COO)**: `coo@example.com`
- **HOD (IT Department)**: `hod.it@example.com`
- **Employee (IT Department)**: `emp.it1@example.com`
- **Garage Manager**: `garage@example.com`

---

## 🛣️ API Endpoints Summary

| Endpoint Group | Prefix | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/api/auth` | No | Google Sign-in initiation, current session `/me`, and logout |
| **Requisitions** | `/api/requests` | Yes | CRUD endpoints for requisitions, my history, and exports |
| **Approvals** | `/api/approvals` | Yes (Manager) | Reviews and decisions for HOD, GMHR, and COO stages |
| **Garage Portal** | `/api/garage` | Yes (Garage) | Vehicles/drivers inventory CRUD, fuel & maintenance logs |
| **Administration** | `/api/admin` | Yes (Admin) | Employee profiles management, destinations/regions configuration, and full audit logs |
