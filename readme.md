# Kaj Tracker (কাজ ট্র্যাকার)

Kaj Tracker is a modern, lightweight work and expense tracking web app designed for teams, project managers, and supervisors. It lets you monitor project budgets, member investments, personal versus company expenses, and reimbursements in real time.

Best of all: it uses **Google Sheets** as its primary database, so all your data remains transparent, backed up, and easy to inspect in your own Google Drive.

---

## ✨ Key Features

- **Google Sheets as Database:** No complex database to maintain. All project works, user investments, expenses, and audit logs live directly in a Google Spreadsheet.
- **Bangla-First Interface:** Default UI in clean Bangla (বাংলা) with an instant English switch. Uses *Noto Sans Bengali* for crisp conjunct rendering and full Bengali numeral formatting (০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯, ৳).
- **Accurate Financial Math:**
  - Budgets, expenses, remaining funds, and personal spending are always dynamically calculated—never stored as stale counters.
  - Clear separation between **Budget Expenses** (company funds) and **Personal Spending** (out-of-pocket costs).
- **Reimbursement Workflow:**
  - When members spend out-of-pocket, the expense owner can mark the expense as reimbursed with a single click.
  - Reimbursing smoothly transitions the amount from personal spending to budget expense, automatically adjusting project totals.
- **Executive Console Design:**
  - Premium dashboard featuring context-aware top headers, dynamic greetings, live clocks, and multi-layered depth cards.
  - Recharts expense visualization and category breakdowns.
- **Universal Shared Lists:**
  - Anyone can add new expense reasons or measurement units (kg, ton, square foot, day, hour, etc.) right from the "Add Expense" dialog or Settings.
- **Crisp PDF Reports:**
  - Native print-ready views that export to PDF via the browser without breaking Bengali script or conjunct characters.

---

## 👥 Role Hierarchy

1. **Main Admin (`main_admin`):**
   - Configured via the `MAIN_ADMIN_EMAIL` environment variable.
   - Has universal access to view and manage all projects.
   - Accesses the system Settings to test the Google Sheets connection and initialize tabs.
2. **Work Admin:**
   - The creator of a specific project ("Work").
   - Can edit project details, assign members, and approve/reimburse personal expenses.
3. **Assigned User:**
   - Members assigned to a project can log expenses (personal or budget-funded), update their investment share, and review financial breakdowns.
4. **Unassigned User:**
   - Anyone can sign in with Google, but unassigned users see a polite holding screen until assigned to a project by an admin.

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and provide your credentials:
```env
# Main Administrator (Global Admin)
MAIN_ADMIN_EMAIL=ifti.k.hoq@gmail.com
VITE_MAIN_ADMIN_EMAIL=ifti.k.hoq@gmail.com

# Firebase Client (Public)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend Credentials (Serverless / Production)
SHEET_ID=your_google_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_ADMIN_JSON={"type":"service_account",...}
VITE_USE_LIVE_API=true
```

> **Note:** The app includes an automatic fallback dev-mode with mock data if Google credentials are not yet configured, allowing you to test the entire interface and workflows immediately!

### 3. Running Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running Tests
Run the math and calculation unit test suite:
```bash
npm test
```

---

## 🛠️ Deployment to Vercel
Kaj Tracker is configured out-of-the-box for Vercel:
1. Connect your GitHub repository to Vercel.
2. Add your environment variables in the Vercel Dashboard (`GOOGLE_SERVICE_ACCOUNT_JSON`, `FIREBASE_ADMIN_JSON`, `MAIN_ADMIN_EMAIL`, `SHEET_ID`).
3. Deploy! The `/api` serverless endpoints and Vite SPA frontend will build and run seamlessly together.

