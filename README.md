# 🚗 Vehicle Requisition Portal

A modern, secure, and scalable web application for managing vehicle requisitions within an organization. Built with React, Node.js/Express, MySQL, and Google OAuth 2.0.

## Features

- **Google OAuth 2.0** — Secure Gmail-based authentication
- **Role-Based Dashboards** — Employee, HOD, COO, Garage, Admin
- **Multi-Level Approval Workflow** — HOD → COO (for beyond-region travel)
- **Vehicle Fleet Management** — Assignment, pickup, drop-off tracking
- **Audit Logging** — Complete activity trail for all operations
- **Responsive Design** — Corporate Blue & White theme with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, React Router v7 |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0+ (mysql2 with connection pooling) |
| Auth | Google OAuth 2.0 via Passport.js, JWT cookies |

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Google Cloud OAuth credentials

### 1. Database Setup

```bash
mysql -u root -p < server/schema.sql
mysql -u root -p < server/seed.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MySQL and Google OAuth credentials
npm install
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Workflow

```
Employee submits request
    ↓
HOD reviews (approve/reject)
    ↓ (if "Beyond Anuppur/Shahdol")
COO reviews (approve/reject)
    ↓
Garage assigns vehicle + driver
    ↓
Pickup → In Transit → Drop-off → Completed
```

## Default Test Accounts

Replace the emails in `server/seed.sql` with real Gmail addresses, then:
- **Admin**: admin@example.com
- **COO**: coo@example.com
- **HOD (IT)**: hod.it@example.com
- **Employee (IT)**: emp.it1@example.com
- **Garage**: garage@example.com

## API Endpoints

| Group | Prefix | Description |
|-------|--------|-------------|
| Auth | `/api/auth` | Google OAuth, /me, /logout |
| Requests | `/api/requests` | Create, view, cancel requests |
| Approvals | `/api/approvals` | HOD and COO approval workflows |
| Garage | `/api/garage` | Vehicle assignment, trip management |
| Admin | `/api/admin` | Employee CRUD, audit logs, dashboard |
