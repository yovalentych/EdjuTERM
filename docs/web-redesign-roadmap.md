# Research Navigator Web Redesign Roadmap

Date: 2026-05-13

## Product Direction

Research Navigator should read as a research operations workspace, not a generic grant tracker. The project workspace is the center of the product and should help a researcher, supervisor, or project member answer four questions quickly:

- What needs attention now?
- What evidence exists and how trustworthy is it?
- What work is planned, funded, blocked, or overdue?
- What outputs are ready for reporting, publication, or open science release?

## Information Architecture

### Personal Area

- Dashboard: user's projects, assignments, recent activity, learning reminders.
- Library: knowledge base and practical guidance.
- Profile: identity, ORCID, affiliation, project-visible bio.
- Settings: preferences, notifications, interface density.
- Admin: oversight, audit, users, projects, invitations.

### Project Workspace

- Overview: command center for health, next actions, timeline, evidence, budget, and outputs.
- Evidence: records, experiments, research almanac, files, versions, provenance, DOI readiness.
- Execution: research plan, milestones, deliverables, task planning, calendar, budget, purchases, events.
- Outputs: open science, Zenodo, reports, manuscripts, portfolio, publication-ready exports.
- Team: members, roles, chat, recent collaboration activity.
- Education: learning journal, activity diary, PhD individual plan.
- Settings: identity, modules, access, members, join codes, data policy.

## Implementation Sequence

### 1. Workspace Shell

- Regroup project navigation into the workspace zones above.
- Keep the existing routes to avoid breaking links.
- Make active state stable for direct routes and query-tab routes.
- Improve mobile drawer labels and grouped navigation.
- Keep sidebar collapse support.

### 2. Project Overview

- Replace decorative overview composition with a command-center layout.
- Add status cards for project health, deadlines, budget, evidence, outputs.
- Add next-action list with direct links.
- Add a compact timeline and recent activity block.
- Add open science readiness and publication/output pipeline.

### 3. Evidence Workspace

- Make records the primary explorer view.
- Add consistent filters, status chips, list/table density, and detail drawer.
- Surface version tree, linked experiments, attached files, and release readiness.
- Tie experiments to input records, protocols, output records, and generated reports.

### 4. Execution Workspace

- Standardize research plan, planning, budget, and events around the same header/action patterns.
- Make milestones and deliverables visible from planning and budget context.
- Add budget variance, pending purchase requests, and upcoming deadlines to overview.

### 5. Outputs Workspace

- Treat reports, manuscripts, portfolio, and open science as one publication pipeline.
- Add readiness checklists and export status.
- Reuse shared editor/preview/action layouts.

### 6. Design System Cleanup

- Consolidate surfaces: page header, workspace header, metric card, status badge, action bar, explorer table, empty state, drawer.
- Keep working UI dense and quiet: restrained color, 8px radius, clear hierarchy, no marketing-style private pages.
- Ensure Ukrainian and English labels remain in dictionaries where practical.

### 7. Responsive Polish

- Use drawer navigation for complex mobile project navigation.
- Convert wide tables to scannable cards or horizontal data tables where appropriate.
- Keep primary actions visible without covering content.

### 8. Verification

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Start `npm run dev` and inspect desktop and mobile breakpoints.
- Capture screenshots for high-risk screens: dashboard, project overview, records, planning, budget, reports.
