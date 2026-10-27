# Kaj Tracker: Decisions and Antigravity Implementation Plan

Work, cost and investment tracking web app. Vite + React frontend, Google Sheets as the database, Firebase Google sign-in.

## Decisions locked in

- **Backend:** a thin Vercel serverless API (Firebase token check, Sheets access via service account). The spreadsheet is the only database.
- **Access:** anyone can sign in with Google, but sees nothing until assigned to a work.
- **Roles:** the **main admin** is global, identified by `MAIN_ADMIN_EMAIL`. The **work admin** is whoever created that work. The main admin can also see and manage every work.
- **Calculated, never stored:** total expense, personal spending, spent from budget, total investment. Total expense counts only budget-paid costings.
- **Language:** Bangla is the default UI language, with an English toggle. Names are typed as-is in either script, with an optional Bangla display name. Bangla digits and ৳ appear in Bangla mode.
- **Shared lists:** any user can add costing reasons and metrics, and everyone shares the same lists. They can be added from the Settings page or inline in the Add Expense modal.

## Three things to confirm

1. **Settings and credentials.** The Settings page cannot safely let you paste secret keys into the browser. So the Settings page (main admin only) will have:
   - **Spreadsheet connection:** a spreadsheet ID field, a **Test connection** button and an **Initialize sheets** button that creates the tabs and headers.
   - **Firebase web config:** a paste field. This config is public by design, so it is safe to store.
   - **Secrets:** the service-account key and Firebase Admin key stay in Vercel env vars. The page only shows "configured ✓ / missing ✗".
   - The non-secret values are stored in a free Upstash/Vercel KV store, so you can change them without redeploying. *Default: go with this.*
2. **Who presses Reimburse?** If a user could reimburse their own personal spending, they would effectively pay themselves from the budget. *Default: only the work admin or main admin can press it, full amount only.* Reimbursing moves that costing from "personal spending" to "spent from budget", which raises total expense. It stays in the audit log with who and when. Say if you want partial reimbursement instead.
3. **PDF with Bangla text.** Most JS PDF libraries break Bangla conjunct letters. *Default: generate PDFs from print-styled pages using the browser's "Save as PDF", which renders Bangla correctly.* Server-side Puppeteer is the heavier alternative.

## Sheet tabs

- `Users`: uid, name, name\_bn, email, role (`main_admin` / `user`), createdAt
- `Works`: workId, name, name\_bn, department, address, totalBudget, createdAt, createdBy (this is the work admin), isCompleted
- `WorkUsers`: workId, userId, investment
- `Costings`: costingId, workId, userId, reasonId, materialAmount, metricId, costAmount, source (`PERSONAL` / `BUDGET`), reimbursedAt, reimbursedBy, note, createdAt
- `Reasons` and `Metrics`: id, name, name\_bn, createdBy
- `AuditLog`: timestamp, userId, action, entity, before, after

A personal cost counts as spent from budget when `source = BUDGET` or `reimbursedAt` is set. Otherwise it counts as personal spending.

## Spreadsheet-specific risks (build these in from the start)

- **Quotas:** Sheets limits reads per minute, so the API reads each tab in one batch call and caches for about 10 seconds. It invalidates the cache on every write.
- **Concurrent writes:** there are no transactions. Costings are append-only with generated IDs, and edits update one row by ID. Totals are always recomputed.
- **Permissions on every endpoint:** a user can only access works they are assigned to, so the API checks this on every call, not the UI alone.

## Implementation plan for Antigravity

Run one phase at a time. For each phase, have it write a plan Artifact first, then check the result before approving the next.

### Phase 0: Manual setup (you, about 20 minutes)

- Create a Firebase project, enable Google sign-in and add your domains.
- Create a Google Cloud service account, enable the Sheets API, and share the spreadsheet with its email as Editor.
- Create a Vercel project with an Upstash KV store.
- Env vars: `GOOGLE_SERVICE_ACCOUNT_JSON`, `FIREBASE_ADMIN_JSON`, `MAIN_ADMIN_EMAIL`, `KV_*`, and optionally the initial `SHEET_ID` and `VITE_FIREBASE_*`.

### Phase 1: Rules and scaffold

- Write `AGENTS.md` with these rules:
  - Vite, React, TypeScript, Tailwind, React Router, TanStack Query, react-i18next.
  - No secrets in client code.
  - All money math in the API only.
  - Every UI string through i18n, with Bangla as the default.
  - Fonts: Noto Sans Bengali + Inter.
- Build the language toggle and Bangla/English number formatting.
- **Check:** Bangla conjuncts (like ক্ষ, স্ত্র) render correctly.

### Phase 2: Auth

- Google login screen, auth context, protected routes, sign-out.
- On first login, create the `Users` row. The email matching `MAIN_ADMIN_EMAIL` gets `main_admin`.
- Unassigned users see a "waiting for an admin to assign you to a work" screen.

### Phase 3: Sheets and API layer

- Token-verification middleware.
- Sheets repository: batch read, append, update by ID, retry, short cache.
- Config endpoints: read/write the KV store, test connection, and initialize sheets.
- Endpoints: works, work-users, costings, reasons/metrics, and `/dashboard?workId=`.
- Unit tests for the aggregation math, covering budget vs personal, reimbursement moving a costing, per-user totals and per-category totals.
- **Check:** tests pass, and a request without a token returns 401. A user not assigned to a work gets 403.

### Phase 4: App shell

- Sidebar: Dashboard, Expenses, Users, Categories, Settings.
- Work switcher in the header (it remembers your last work), plus a mobile drawer.

### Phase 5: Dashboard

- Three tablets: Total Budget, Total Expense, Total Investment, plus remaining budget.
- A "my details" card: my investment (editable), my personal spending, and my spent from budget.
- **Add Expense** modal: reason dropdown with inline "add new", optional material amount, metric dropdown with inline "add new", cost, and a source toggle. Validate, then refresh.

### Phase 6: Report pages

- **Expenses:** filters by user, reason, source and date. Edit and delete follow the rules. Personal rows show a **Reimburse** button for admins only.
- **Users:** investment, personal spending and budget spending per user. You can edit only your own investment, and admins can edit all.
- **Categories:** total and percentage per reason, with a chart.

### Phase 7: Admin and Settings

- Create and edit works, assign users, mark complete. The work creator becomes the work admin.
- Reasons and Metrics management.
- Main-admin-only section: sheet connection and Firebase web config, as described above.

### Phase 8: PDF exports

Print-styled report pages, each with a "Download PDF" button:

- Full work summary
- All expenses (respecting the current filters)
- User-wise report
- Category-wise report
- Single-user statement
- Reimbursement history

### Phase 9: Polish and deploy

- Loading, empty and error states, plus a budget-overrun warning.
- Deploy to Vercel.
- Run the Antigravity browser agent through: log in, add a budget expense and a personal expense, reimburse one, toggle language, export a PDF, and check totals.

## Tips

- Put the Phase 3 tests before any UI work.
- Never paste keys into prompts, only into env vars.
