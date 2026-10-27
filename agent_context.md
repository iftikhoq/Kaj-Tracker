# Agent Context - Kaj Tracker (কাজ ট্র্যাকার)

## Project Overview & Persona
- **Owner / Client:** Ifti
- **Role:** Software Manager & Primary Heavy Lifter Developer
- **Product:** Kaj Tracker (কাজ ট্র্যাকার) - An executive web application for tracking ongoing project works, investments, expenses (personal vs budget), and reimbursements.
- **Primary Database:** Google Sheets (sole single-source-of-truth database accessed via Google Service Account API).
- **Authentication:** Firebase Google Sign-In with server-side token validation.
- **Frontend Stack:** React 18 / Vite / TypeScript / Tailwind CSS / React Router / TanStack Query / react-i18next / Lucide React / Sonner.
- **Design System:** Luxury executive admin console aesthetics (from `admin-panel-builder` and `transitions-dev`): multi-layered depth shading, context-aware top banner with live clock and greeting, responsive sticky navigation, smooth CSS micro-interactions.

---

## Core Business & Calculation Rules
1. **Never Stored, Always Computed:**
   - **Total Budget:** Defined per Work.
   - **Total Expense:** Sum of all costings where `source === 'BUDGET'` OR `reimbursedAt` is not null.
   - **Personal Spending (per user or total):** Sum of costings where `source === 'PERSONAL'` AND `reimbursedAt` is null.
   - **Spent from Budget (per user or total):** Sum of costings where `source === 'BUDGET'` OR `reimbursedAt` is not null.
   - **Remaining Budget:** `totalBudget - totalExpense`.
   - **Total Investment:** Sum of `investment` values across assigned users in `WorkUsers`.
2. **Access & Permissions:**
   - Anyone can sign in with Google.
   - Unassigned users are shown a clean "Waiting for Admin Assignment" screen.
   - **Main Admin:** Identified globally by `MAIN_ADMIN_EMAIL`. Can view/manage every work, access system settings (Sheets connection, Firebase configuration, Sheet initializations), and assign users.
   - **Work Admin:** The creator of the Work (`createdBy`). Can edit the work details, assign users, view reports, and reimburse personal expenses.
   - **Users:** Assigned members of a work. Can log personal or budget expenses, update their own investment number, view reports, and export PDFs.
3. **Reimbursements:**
   - Only a Work Admin or Main Admin can reimburse personal expenses.
   - Reimbursement is full amount, marking `reimbursedAt` (timestamp) and `reimbursedBy` (admin identifier).
   - Once reimbursed, that expense counts as "Spent from Budget" and increases "Total Expense".
   - Reimbursement actions are recorded in the `AuditLog` sheet.
4. **Localization (Bangla First):**
   - Bangla (`bn`) is the default UI language, with an instant toggle for English (`en`).
   - Bangla digits (০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯) and currency symbol ৳ are rendered in Bangla mode.
   - Font family: `Noto Sans Bengali` + `Inter` for clean Bengali conjunct characters (যুক্তবর্ণ).
5. **Shared Metrics & Reasons:**
   - Any assigned user can create new Costing Reasons and Metrics either in Settings or inline in the "Add Expense" dialog.
   - All users across the work share these reasons and metrics.
6. **PDF Generation:**
   - High-fidelity print styles via browser print dialog (`window.print()`) with print CSS to guarantee 100% accurate rendering of Bangla typography and conjuncts without server canvas breakage.

---

## Operating Instructions & Workflow Standards
- **Mandatory Files:**
  - `version_documentation.md`: Kept up-to-date with date, version number (ver 1.x.x), and fine-grained change logs.
  - `agent_context.md`: Project memory, rules, and guidelines from Ifti.
  - `readme.md`: Clean, human-written guide for setup, architecture, and workflow.
  - `.gitignore`: Updated whenever new credential or build artifacts are introduced.
- **Safety:**
  - Never expose private keys or service account credentials in client code or Git.
  - Use environment variables (`GOOGLE_SERVICE_ACCOUNT_JSON`, `FIREBASE_ADMIN_JSON`, `MAIN_ADMIN_EMAIL`, etc.).
  - Provide a local mock/demo store capability so the app runs out-of-the-box for development and verification before production credentials are plugged in.
