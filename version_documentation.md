# Version Documentation - Kaj Tracker (কাজ ট্র্যাকার)

All versions, dates, and detailed change logs for Kaj Tracker are maintained in this document.

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

