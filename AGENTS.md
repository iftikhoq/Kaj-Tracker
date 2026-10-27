# Developer & Agent Guidelines - Kaj Tracker (কাজ ট্র্যাকার)

1. **Tech Stack & Libraries:**
   - **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router v7 / v6, TanStack Query (`@tanstack/react-query`), `react-i18next` & `i18next`, Lucide React icons, Sonner toast notifications, Recharts.
   - **Backend:** Vercel Serverless Functions (`/api/*`) with Google Sheets API and Firebase Admin SDK.
   - **Testing:** Vitest for mathematical integrity and aggregation tests.

2. **Security & Secrets:**
   - NEVER put secrets, service account credentials, or Firebase Admin keys in client-side code (`src/`).
   - Client-side code only receives public Firebase Web client configs via `import.meta.env` or public settings.
   - Service account private keys and admin keys must stay in environment variables (`GOOGLE_SERVICE_ACCOUNT_JSON`, `FIREBASE_ADMIN_JSON`).

3. **Financial Math & Aggregations:**
   - All financial and expense calculations must follow the pure business rules:
     - `totalExpense` counts only budget-paid costs (`source === 'BUDGET'` OR `reimbursedAt` is non-empty).
     - `personalSpending` counts only unreimbursed personal costs (`source === 'PERSONAL'` AND `reimbursedAt` is null/empty).
     - `spentFromBudget` counts all budget-paid costs + reimbursed personal costs.
     - `remainingBudget` is `totalBudget - totalExpense`.
     - `totalInvestment` is the sum of all assigned user investments for the work.
   - Never store calculated sums in the spreadsheet rows; always compute dynamically from raw costings and work users.

4. **Localization (i18n):**
   - Bangla (`bn`) is the default UI language, with an English (`en`) toggle.
   - Every UI string must pass through the i18n translation system.
   - All numbers, amounts, dates, and currency (৳) must render in Bengali numerals when in Bangla mode (`formatCurrency`, `formatNumber`, `formatDate`).
   - Fonts: `Noto Sans Bengali` for Bengali text + `Inter` for Latin typography. Ensure Bengali conjuncts (যেমন: ক্ষ, স্ত্র, ঙ্ক, ঙ্গ, ঙ্ঘ, ঞ্চ, ঞ্ছ, ঞ্জ, ঞ্ঝ, ণ্ট, ণ্ঠ, ণ্ড, ণ্ণ, ষ্ণ, হ্ম) render with crisp font ligation without breaking.

5. **Permissions & Work Scopes:**
   - Global Main Admin is identified by `MAIN_ADMIN_EMAIL`.
   - Work Admin is identified by `createdBy` in the `Works` sheet tab.
   - Reimbursement can be performed ONLY by the expense owner (`costing.userId === currentUser.uid`).
   - Work Admin or Main Admin can manage member assignments for a work.
   - Non-assigned users cannot view work data and must see a waiting screen.

