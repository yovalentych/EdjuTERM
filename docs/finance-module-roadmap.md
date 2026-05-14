# Project Finance / Кошторис Roadmap

Date: 2026-05-13

## Direction

The finance module should not behave like a personal finance dashboard. It should model grant and research-project finance:

- Plan: approved budget structure.
- Commitment: approved or submitted financial obligations that are not paid yet.
- Actual: real paid expenses.
- Evidence: documents, invoices, acts, receipts, and report-ready exports.

Core formula:

```text
Remaining = Planned / Approved Budget - Spent - Committed
```

The current codebase already has budget periods, budget line items, purchase requests, approval, purchased status, audit events, and report exports. The redesign should extend that foundation rather than replace the stack.

## Current Foundation

- Page: `src/app/[locale]/app/budget/page.tsx`
- Domain logic: `src/lib/budget.ts`
- Schemas: `src/lib/schemas.ts`
- Components:
  - `src/components/budget/budget-item-registry.tsx`
  - `src/components/budget/purchase-request-form.tsx`
  - `src/components/budget/purchase-request-list.tsx`
  - `src/components/budget/budget-period-list.tsx`
- Actions: `src/app/actions.ts`
- Report integration:
  - `src/lib/report-export-data.ts`
  - `src/lib/exporters/xlsx-exporter.ts`
  - `src/lib/exporters/txt-exporter.ts`
  - `src/app/api/reports/[reportId]/docx/route.ts`
  - `src/app/api/reports/[reportId]/pptx/route.ts`

## Target Navigation

Keep the public route simple for now:

```text
/app/budget?projectId=...
```

Inside the page, evolve tabs toward:

- Overview
- Budget Plan
- Requests
- Expenses
- Documents
- Reports
- Settings

MVP can keep the current three tabs and rename/expand them gradually:

- `items` -> Budget Plan
- `requests` -> Purchase Requests
- `analytics` -> Finance Overview / Analytics

## Phase 1. Finance Overview

Goal: make the first screen answer whether the grant budget is healthy.

Implement:

- Add a finance command center above tabs.
- Show KPI cards:
  - Total Budget
  - Committed
  - Spent
  - Remaining
  - Burn Rate
  - Pending Requests
- Add warning states:
  - overspent category
  - committed + spent above planned
  - submitted requests waiting for approval
  - no budget lines
  - purchases without actual amount
- Add category usage summary with planned / committed / spent.
- Link each warning to the relevant tab.

Files:

- `src/app/[locale]/app/budget/page.tsx`
- optionally `src/components/budget/finance-overview.tsx`

## Phase 2. Budget Plan

Goal: make budget lines behave like a real grant budget plan.

Implement:

- Add columns:
  - Planned
  - Committed
  - Spent
  - Remaining
  - Status
- Calculate category and line-item usage from linked purchase requests.
- Add stage/period filter.
- Add category filter.
- Show over-budget indicators per line and category.
- Add "unlinked requests" warning when purchases are not tied to a budget line.
- Keep current add-budget-line form, but move it into a compact collapsible section.

Files:

- `src/components/budget/budget-item-registry.tsx`
- `src/lib/budget.ts`

## Phase 3. Purchase Requests Workflow

Goal: represent commitments before they become expenses.

Implement status model:

```text
Draft
Submitted
Needs clarification
Approved
Ordered
Received
Paid
Rejected
Cancelled
```

Current statuses:

```text
draft
submitted
approved
rejected
purchased
delivered
```

Incremental approach:

- Keep existing statuses for compatibility.
- Add UI grouping:
  - Draft
  - Waiting approval
  - Approved / committed
  - Paid / actual
  - Rejected / closed
- Add filters by status, category, period, vendor.
- Show estimated vs actual amount clearly.
- Add "linked budget line" display.
- Add warning when approved request has no linked line item.

Files:

- `src/components/budget/purchase-request-list.tsx`
- `src/components/budget/purchase-request-form.tsx`
- `src/lib/schemas.ts` only if adding new statuses.

## Phase 4. Expenses / Actuals

Goal: separate real paid expenses from requests.

MVP approach:

- Treat `purchased` and `delivered` purchase requests as actual expenses.
- Add an "Expenses" tab that lists paid requests as a finance ledger.
- Columns:
  - Date
  - Category
  - Period / stage
  - Vendor
  - Description
  - Estimated
  - Actual
  - Document status
  - Created by / approved by

Later approach:

- Add a dedicated `expense_records` collection if the workflow needs payments independent of purchase requests.

Files:

- `src/app/[locale]/app/budget/page.tsx`
- new `src/components/budget/expense-ledger.tsx`
- possibly `src/lib/budget.ts`

## Phase 5. Documents

Goal: connect finance to audit and reporting evidence.

Implement:

- Add document attachment metadata to purchase requests or expenses:
  - invoice
  - act
  - receipt
  - contract
  - payment confirmation
- Reuse existing file storage patterns where possible.
- Add missing-documents panel.
- Add document checklist per paid expense.

Files:

- `src/lib/schemas.ts`
- `src/lib/file-storage.ts`
- `src/components/budget/purchase-request-list.tsx`
- possibly new API route for finance file preview/download.

## Phase 6. Reports

Goal: make finance report-ready.

Implement:

- Add finance report builder panel:
  - period
  - categories
  - include requests
  - include expenses
  - include missing documents
  - include charts
- Expand current export data with:
  - remaining amount
  - committed amount by category
  - paid amount by category
  - over-budget categories
  - missing documents
- Keep current XLSX/DOCX/PPTX integration.

Files:

- `src/lib/report-export-data.ts`
- `src/lib/exporters/xlsx-exporter.ts`
- `src/app/api/reports/[reportId]/docx/route.ts`
- `src/app/api/reports/[reportId]/pptx/route.ts`
- `src/components/reports/export-preview-modal.tsx`

## Phase 7. Permissions and Audit

Goal: make finance safe for supervisor/admin workflows.

Implement:

- Members can create draft/submitted requests.
- Supervisors/admins approve/reject.
- Owner/requester or manager can mark paid/purchased depending on project policy.
- Audit events for:
  - line item edit
  - request status change
  - actual amount change
  - document upload/delete
  - report export

Files:

- `src/app/actions.ts`
- `src/lib/audit.ts`
- `src/components/audit/audit-log.tsx`

## First Implementation Order

1. Add finance command center to the budget page.
2. Improve `getBudgetSummary` to expose `remaining`, category committed amounts, pending count, and over-budget flags.
3. Upgrade Budget Plan table to show Plan / Commitment / Actual / Remaining.
4. Add request filters and workflow grouping.
5. Add Expenses tab based on paid purchase requests.
6. Add document checklist metadata.
7. Expand finance exports.

## Non-Goals for Now

- Do not migrate to Prisma/PostgreSQL.
- Do not add a new UI framework.
- Do not introduce TanStack Table until the existing table components become a blocker.
- Do not rewrite purchase requests from scratch before the current workflow is stabilized.
