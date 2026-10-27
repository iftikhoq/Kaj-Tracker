# Version Documentation - Kaj Tracker (কাজ ট্র্যাকার)

All versions, dates, and detailed change logs for Kaj Tracker are maintained in this document.

---

## [ver 1.0.8] - 2026-10-28
### Status: Sheet ID Header Fallback & Uninitialized Sheet Resilience
- **Uninitialized Sheet Error Prevention ([`api/sheetsService.ts`](file:///e:/Projects/Kaj%20Tracker/api/sheetsService.ts)):**
  - Updated `batchReadAllTabs` to inspect existing spreadsheet tab titles via metadata before reading ranges. Prevents Google API `400 Unable to parse range: Users!A:Z` when opening newly created, blank spreadsheets.
- **Graceful Unconfigured Endpoint Handlers:**
  - Updated [`api/works.ts`](file:///e:/Projects/Kaj%20Tracker/api/works.ts), [`api/dashboard.ts`](file:///e:/Projects/Kaj%20Tracker/api/dashboard.ts), [`api/costings.ts`](file:///e:/Projects/Kaj%20Tracker/api/costings.ts), [`api/users.ts`](file:///e:/Projects/Kaj%20Tracker/api/users.ts), and [`api/categories.ts`](file:///e:/Projects/Kaj%20Tracker/api/categories.ts) to accept `x-sheet-id` header or query fallback and return safe empty payloads (HTTP 200) instead of throwing 500 Internal Server Error when `SHEET_ID` is pending setup.
- **Client Header Attachment ([`src/services/api.ts`](file:///e:/Projects/Kaj%20Tracker/src/services/api.ts)):**
  - Added `getHeaders` sending `x-sheet-id` from client settings dynamically across all server requests.

---

## [ver 1.0.7] - 2026-10-28
### Status: Serverless Production Dependencies Fix for Vercel
- **Serverless Dependencies Relocation ([`package.json`](file:///e:/Projects/Kaj%20Tracker/package.json)):**
  - Moved `googleapis` and `firebase-admin` from `devDependencies` into production `dependencies`.
  - In Vercel serverless environments with `NODE_ENV=production`, packages in `devDependencies` are pruned during deployment. This caused runtime `MODULE_NOT_FOUND` exceptions whenever serverless endpoints (`/api/settings`, `/api/works`, `/api/costings`, etc.) attempted to import `firebase-admin` or `googleapis`, leading directly to HTTP 500 Internal Server Errors.
  - Verified local installation and production build verification (`npm run build`).

---

## [ver 1.0.6] - 2026-10-28
### Status: Production Google Sheets Connection & Diagnostic Fix
- **Service Account Credentials & RSA Parsing in Vercel:**
  - Implemented [`parseServiceAccountCredentials`](file:///e:/Projects/Kaj%20Tracker/api/sheetsService.ts) to automatically normalize RSA private keys (`replace(/\\n/g, '\n')`), resolving OpenSSL `DECODER routines::unsupported` errors caused by escaped newlines in Vercel environment variables.
  - Added support for Base64-encoded JSON credentials and double-stringified JSON inputs.
- **Graceful Auth Fallback in Serverless API:**
  - Updated [`api/authMiddleware.ts`](file:///e:/Projects/Kaj%20Tracker/api/authMiddleware.ts): If `FIREBASE_ADMIN_JSON` is not explicitly set, automatically fall back to `GOOGLE_SERVICE_ACCOUNT_JSON`.
  - Added graceful JWT payload fallback if Firebase Admin is uninitialized, preventing fatal 500 errors during initial setup.
- **Specific Google Sheets API Error Handling:**
  - Updated [`api/settings.ts`](file:///e:/Projects/Kaj%20Tracker/api/settings.ts): Transformed Google API error codes into descriptive Bengali messages:
    - `403 Permission Denied`: Informs the administrator to share the Google Sheet with the exact service account email as 'Editor'.
    - `404 Not Found`: Instructs verification of the Spreadsheet ID and sharing status.
    - `API Disabled`: Alerts if "Google Sheets API" is not enabled in the Google Cloud project.
  - Provided `serviceAccountEmail` in settings API responses.
- **Settings Console Diagnostics ([`SettingsPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/SettingsPage.tsx)):**
  - Integrated live `GET /api/settings` query on mount to reflect true Vercel environment variables status.
  - Added dedicated Service Account banner with 1-click **"ইমেইল কপি করুন" (Copy Email)** button so users immediately know which email to invite to their Google Sheet.
  - Enhanced [`api.ts`](file:///e:/Projects/Kaj%20Tracker/src/services/api.ts) to surface server-provided error messages directly into toast notifications.

---

## [ver 1.0.5] - 2026-10-28
### Status: Typography Scale Enlargement & Layout Polish
- **Bengali & Latin Typography Scale Enhancement:**
  - Expanded font size tokens in [`tailwind.config.js`](file:///e:/Projects/Kaj%20Tracker/tailwind.config.js) to improve legibility for complex Bengali conjunct characters (যুক্তবর্ণ) and upper/lower vowel diacritics:
    - `xs`: `0.8125rem` (13px, was 12px) with `lineHeight: 1.25rem`
    - `sm`: `0.925rem` (14.8px, was 14px) with `lineHeight: 1.375rem`
    - `base`: `1.05rem` (16.8px, was 16px) with `lineHeight: 1.625rem`
    - `lg`: `1.2rem` (19.2px, was 18px) with `lineHeight: 1.75rem`
    - `xl`: `1.35rem` (21.6px, was 20px) with `lineHeight: 1.875rem`
    - `2xl`: `1.65rem` (26.4px, was 24px) with `lineHeight: 2.125rem`
  - Replaced all hardcoded micro font classes (`text-[9px]`, `text-[10px]`, `text-[11px]`) across the entire codebase with modern, responsive tokens (`text-xs`, `text-sm`, `text-2xs`).
  - Refactored components and views for crisp layout spacing without overlap:
    - [`MyDetailsCard.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/dashboard/MyDetailsCard.tsx): Upgraded metric titles, user tags, and sub-descriptions to `text-xs`.
    - [`RecentExpensesTable.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/dashboard/RecentExpensesTable.tsx): Upgraded table headers, timestamps, and status pills to `text-xs` with expanded padding.
    - [`ExpensesPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/ExpensesPage.tsx): Standardized table headers, notes, and status indicators.
    - [`CategoriesPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/CategoriesPage.tsx) & [`CategoryPieChart.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/dashboard/CategoryPieChart.tsx): Upgraded chart legend and category breakdown tables.
    - [`UsersPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/UsersPage.tsx): Cleaned up user badges, emails, and investment counters.
    - [`WorksPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/WorksPage.tsx): Enlarged project card headings to `text-lg` and budget amounts to `text-base`.
    - [`ReportsPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/ReportsPage.tsx): Optimized print-ready financial statement stat boxes and document signatures.
    - [`AddExpenseModal.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/expenses/AddExpenseModal.tsx): Upgraded form labels and action links.
    - [`LoginPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/LoginPage.tsx) & [`WaitingApprovalPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/WaitingApprovalPage.tsx): Enhanced demo mode button text and explanatory instructions.
- **Dropdown & Stacking Context Elevation:**
  - Elevated [`HeaderBanner`](file:///e:/Projects/Kaj%20Tracker/src/components/layout/HeaderBanner.tsx) to `relative z-30` ensuring [`WorkSwitcher`](file:///e:/Projects/Kaj%20Tracker/src/components/layout/WorkSwitcher.tsx)'s project menu seamlessly overlays subsequent page content without being clipped.
  - Confirmed all modals render cleanly via [`Modal.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/common/Modal.tsx) portal (`z-[100]`) above all headers and sidebars.

---

## [ver 1.0.4] - 2026-10-28
### Status: Stacking Context & Portal Modal Elevation Fix
- **Modal Stacking Context Resolution:**
  - Diagnosed stacking context entrapment caused by parent container CSS animation (`.t-panel-slide` with `transform: translateY(...)`), which was trapping `position: fixed` modals beneath the sibling [`HeaderBanner`](file:///e:/Projects/Kaj%20Tracker/src/components/layout/HeaderBanner.tsx).
  - Created a universal [`Modal.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/common/Modal.tsx) component using `createPortal(..., document.body)` with `z-[100]` and `overflow-y-auto`.
  - Re-anchored all dialog modals in the app into this portal architecture:
    - Create Work Modal in [`WorksPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/WorksPage.tsx)
    - Add Expense Modal in [`AddExpenseModal.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/expenses/AddExpenseModal.tsx)
    - Assign Member Modal in [`UsersPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/UsersPage.tsx)
  - Added automatic background scroll locking (`document.body.style.overflow = 'hidden'`) and Escape key dismiss listeners.

---

## [ver 1.0.3] - 2026-10-28
### Status: Business Rule Update - Owner-Exclusive Expense Reimbursement
- **Reimbursement Authorization Change:**
  - Shifted reimbursement authority exclusively to the expense owner (`costing.userId === currentUser.uid`).
  - Server validation in [`api/costings.ts`](file:///e:/Projects/Kaj%20Tracker/api/costings.ts): Only the user matching the costing's `userId` can execute `action === 'REIMBURSE'`; attempts by non-owners are rejected with HTTP 403 Forbidden.
  - Client state store in [`src/services/storage.ts`](file:///e:/Projects/Kaj%20Tracker/src/services/storage.ts): Rejection with `Error('Only the expense owner can reimburse this personal expense')` if a non-owner invokes reimbursement.
  - UI visibility in [`RecentExpensesTable.tsx`](file:///e:/Projects/Kaj%20Tracker/src/components/dashboard/RecentExpensesTable.tsx) and [`ExpensesPage.tsx`](file:///e:/Projects/Kaj%20Tracker/src/pages/ExpensesPage.tsx): The `Reimburse` action button now only renders on a row if the currently logged-in user is the owner of that expense (`c.userId === currentUser.uid`).
  - Unit tests updated in [`tests/mathEngine.test.ts`](file:///e:/Projects/Kaj%20Tracker/tests/mathEngine.test.ts): Verified that owner reimbursement succeeds and third-party reimbursement fails.

---

## [ver 1.0.2] - 2026-10-28
### Status: Global Admin Designation & Vercel Production Readiness
- **Global Administrator Update:**
  - Configured `ifti.k.hoq@gmail.com` as the default global main administrator (`main_admin`) across server middleware ([`authMiddleware.ts`](file:///e:/Projects/Kaj%20Tracker/api/authMiddleware.ts)), client context ([`AuthContext.tsx`](file:///e:/Projects/Kaj%20Tracker/src/context/AuthContext.tsx)), mock store seed data ([`mockData.ts`](file:///e:/Projects/Kaj%20Tracker/src/services/mockData.ts)), and unit test assertions ([`apiMiddleware.test.ts`](file:///e:/Projects/Kaj%20Tracker/tests/apiMiddleware.test.ts)).
  - Ensured client-side synchronization automatically promotes `ifti.k.hoq@gmail.com` to `main_admin` upon signing in with Google or selecting demo admin.
- **Vercel Serverless & Deployment Readiness:**
  - Configured [vercel.json](file:///e:/Projects/Kaj%20Tracker/vercel.json) with explicit negative lookahead rewrites (`/((?!api/).*)` -> `/index.html`) so API serverless endpoints are never swallowed by SPA routing.
  - Added [api/users.ts](file:///e:/Projects/Kaj%20Tracker/api/users.ts) (user listing, assignment to works, and investment patching) and [api/categories.ts](file:///e:/Projects/Kaj%20Tracker/api/categories.ts) (reasons and metrics CRUD) for complete backend coverage on Google Sheets.
  - Implemented Rollup code-splitting in [vite.config.ts](file:///e:/Projects/Kaj%20Tracker/vite.config.ts) (`vendor-react`, `vendor-charts`, `vendor-ui`) achieving sub-5s production build times and eliminating large chunk warnings.

---

## [ver 1.0.1] - 2026-10-28
### Status: UI Polish & Dropdown Overflow Fix
- **Header Banner Overflow Resolution:**
  - Removed `overflow-hidden` from the outer container of [`HeaderBanner`](file:///e:/Projects/Kaj%20Tracker/src/components/layout/HeaderBanner.tsx#L116) which was clipping absolute child overlays.
  - Confined `overflow-hidden` and `rounded-2xl` strictly to the background radial glow / watermark layer so glow effects remain bounded while allowing interactive dropdown menus to float freely over content.
  - Elevated [`HeaderBanner`](file:///e:/Projects/Kaj%20Tracker/src/components/layout/HeaderBanner.tsx#L116) to `z-20` so dropdown popovers stay atop the subsequent page content.
- **Work Switcher Positioning:**
  - Adjusted dropdown menu in [`WorkSwitcher`](file:///e:/Projects/Kaj%20Tracker/src/components/layout/WorkSwitcher.tsx#L57) with `top-full right-0 mt-2` and `z-50 backdrop-blur-xl` for crisp, unclipped presentation.

---

## [ver 1.0.0] - 2026-10-28
### Status: Initial Project Release & Full Stack Implementation

### Key Milestones & Features Implemented:
1. **Core Architecture Setup:**
   - Client: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, Sonner toast alerts, TanStack Query, and React Router.
   - Server / API: Node.js / Vercel Serverless Functions (`/api/*`) with Google Sheets API integration via Service Account and Firebase Admin SDK authentication.
   - Local Dev & Fallback Mode: Embedded mock / local storage engine allowing local development and testing even prior to connecting live Google Cloud / Firebase keys.

2. **Google Sheets Database Design:**
   - Automated tab initialization and batch reading/writing:
     - `Users`: (uid, name, name_bn, email, role, createdAt)
     - `Works`: (workId, name, name_bn, department, address, totalBudget, createdAt, createdBy, isCompleted)
     - `WorkUsers`: (workId, userId, investment)
     - `Costings`: (costingId, workId, userId, reasonId, materialAmount, metricId, costAmount, source, reimbursedAt, reimbursedBy, note, createdAt)
     - `Reasons` & `Metrics`: (id, name, name_bn, createdBy)
     - `AuditLog`: (timestamp, userId, action, entity, before, after)
   - Cache layer (10-second TTL) with eager invalidation on writes to prevent hitting Google Sheets rate limits.

3. **Financial Math & Aggregations:**
   - Calculation engine ensuring money math is strictly computed server-side / dynamically:
     - `totalExpense`: Sum of budget costs + reimbursed personal costs.
     - `personalSpending`: Unreimbursed personal costs.
     - `spentFromBudget`: Budget costs + reimbursed personal costs.
     - `remainingBudget`: `totalBudget - totalExpense`.
     - `totalInvestment`: Sum of user investments.
   - Comprehensive unit test suite covering math integrity, reimbursement transitions, and permission guards.

4. **Authentication & Authorization:**
   - Firebase Google Sign-In with Bearer token authentication.
   - Multi-tier role permissions: `main_admin`, `work_admin`, and assigned `user`.
   - Gatekeeper screen for unassigned users.

5. **Executive Admin UI & Localization:**
   - Executive dashboard based on `admin-panel-builder` and `transitions-dev` with multi-layer depth card shading and dynamic top banner with live clock.
   - Bilingual support: Bangla (default) and English with instant toggle.
   - Bengali font support (`Noto Sans Bengali` + `Inter`) rendering complex conjunct characters without distortion.
   - Number and currency formatting with Bengali digits (০-৯) and Taka symbol (৳).

6. **Interactive Features:**
   - Work switcher with memory of the last active project.
   - "Add Expense" dialog with instant inline creation of new Reasons and Metrics.
   - Reimbursement one-click workflow for work admins and main admins.
   - User investment inline editing.
   - Category expense breakdowns with charts and visual progress bars.
   - Print-styled PDF export pages for work summaries, expense ledgers, user statements, and reimbursement logs.

