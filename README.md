# Dayflow — HR Management System

"Every workday, perfectly aligned." A full-stack HRMS with role-based
dashboards for employees and HR admins: attendance, leave, payroll, profiles,
notifications, and reports.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB Atlas (via Mongoose)
- **Auth:** JWT access + refresh tokens, bcrypt password hashing

## 1. Set up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Under **Database Access**, create a database user with a password.
3. Under **Network Access**, add your current IP (or `0.0.0.0/0` for local dev).
4. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/`
5. Append a database name to the end, e.g. `.../dayflow?retryWrites=true&w=majority`.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: paste your MONGODB_URI, set your own JWT secrets
npm install
npm run seed   # creates an admin + 4 sample employees with data
npm run dev    # starts the API on http://localhost:5000
```

Seeded logins (password for all: `Password123`):
- Admin: `admin@dayflow.io`
- Employees: `emp-001@dayflow.io` … `emp-004@dayflow.io`

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev    # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend on port
5000, so you don't need CORS config changes for local development.

## Project structure

```
dayflow/
├── backend/
│   └── src/
│       ├── models/       Mongoose schemas (User, Profile, Attendance, ...)
│       ├── controllers/  Route handlers
│       ├── routes/       Express routers (auth, user, admin, reports)
│       ├── middleware/   JWT auth, role guard, upload, error handler
│       ├── services/     Token signing, stubbed email sender
│       ├── utils/        Zod validation schemas
│       └── seed.ts       Sample data generator
└── frontend/
    └── src/
        ├── pages/auth/     Sign in, sign up, verify email
        ├── pages/employee/ Dashboard, profile, attendance, leave, payroll
        ├── pages/admin/    Dashboard, employees, attendance, leave, payroll, reports
        ├── components/     Sidebar, layout, cards, badges, notification bell
        ├── context/        Auth context (JWT storage, current user)
        └── api/client.ts   Axios instance with automatic token refresh
```

## Design

Clean, light interface: white backgrounds with a light-purple (`lavender`)
accent, soft shadows instead of heavy borders, and small transition/fade
animations on page load and interactive elements — no flashy motion, built
to stay readable and fast on any screen size (sidebar collapses gracefully,
tables scroll horizontally on mobile).

## Notes

- Email verification links are logged to the backend console (no real email
  provider wired up) — swap `src/services/emailService.ts` for
  SendGrid/Resend when you're ready to go live.
- Uploaded files (profile pictures, documents) are stored in
  `backend/uploads/` and served statically — swap for S3 by changing
  `middleware/upload.ts` when needed.
- All role checks are enforced server-side in `middleware/auth.ts`, not just
  hidden in the UI.

## 👥 Team & Contributors

Developed as part of the **Odoo × NMIT** Hackathon initiative.

### 💻 Team Members
- **Balaji G S** ([@balajigs08](https://github.com/balajigs08))
- **Abhishek Kokkari** ([@Abhishek-kokkari](https://github.com/Abhishek-kokkari))
- **Akash Gaonkar** ([@Akash6236](https://github.com/Akash6236))
- **Suprith** ([@Supri21-ops](https://github.com/suprith21))

### 🎯 Evaluator & Mentorship
- **Althaf** ([@alsh-odoo](https://github.com/alsh-odoo)) — *Odoo Evaluator*
- **Odoo Hackathon Team** ([@hackathon-odoo](https://github.com/hackathon-odoo)) — *Evaluator*
