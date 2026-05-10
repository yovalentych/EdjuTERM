# Grant Project Manager

Next.js web application for managing a research grant project and its open science evidence: stages, datasets, raw data metadata, protocols, samples, team work, risks, outputs, repositories, and DOI-ready release packages.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- MongoDB Node.js driver
- Zod validation
- lucide-react icons

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The app does not ship mock project content. Without MongoDB it uses empty in-memory development stores; to persist records, set:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=grant_project_manager
```

## Current routes

- `/` - redirects to `/uk`
- `/uk` - Ukrainian public project page
- `/en` - English public project page
- `/uk/login`, `/en/login` - localized login pages
- `/uk/register`, `/en/register` - localized registration pages
- `/uk/app`, `/en/app` - private personal dashboard for authenticated users
- `/uk/app/profile`, `/en/app/profile` - private user profile page
- `/uk/app/settings`, `/en/app/settings` - private user settings page
- `/uk/app/member?userId=...&projectId=...`, `/en/app/member?userId=...&projectId=...` - private team member profile page
- `/uk/app/admin`, `/en/app/admin` - private admin cabinet for application oversight
- `/uk/app/project?projectId=...`, `/en/app/project?projectId=...` - private project workspace opened from the dashboard
- `/uk/app/team`, `/en/app/team` - legacy private team page with project members and shared chat
- `/uk/projects/new`, `/en/projects/new` - private project creation page
- `/uk/app/project-settings?projectId=...`, `/en/app/project-settings?projectId=...` - private project settings and member management
- `/uk/open-science`, `/en/open-science` - public open science data/update pages
- `/uk/app/open-science`, `/en/app/open-science` - legacy private open science publication editor
- `/api/records` - `GET` list records, `POST` create record
- `/api/records/[id]` - `PATCH` update record, `DELETE` delete record

Private pages and record APIs require a signed session cookie. After login the
top-level private area is intentionally personal: dashboard, profile, and user
settings. Project-specific work is entered from a dashboard project card and
opens under the project workspace route so team chat, records, evidence matrix,
and open science drafting stay scoped to the selected project.

## Localization

UI text is stored in `src/lib/i18n.ts`. Keep Ukrainian and English strings in separate dictionary branches and pass the active dictionary into components. Do not hard-code UI labels directly in components unless the value is a scientific acronym, repository name, or stable technical identifier.

## MongoDB collections

Initial collections:

- `project_records`
- `users`
- `projects`
- `open_science_updates`
- `team_messages`
- `project_invitations`
- `audit_events`

Planned collections:

- `raw_data_files` - file metadata, checksums, storage URI, relation to dataset/sample/protocol
- `samples` - biological sample inventory and storage metadata
- `decisions` - scientific and operational decision log
The application currently writes audit events for project creation, settings
changes, member changes, invitations, join-code usage, profile edits, and admin
cabinet views.

## Roles

- `admin` - developer role with full access. Registration grants this role only when the email is listed in `ADMIN_EMAILS`.
- `supervisor` - project lead. A regular user becomes supervisor after creating an own project.
- `member` - project member role for assigned project participants.
- `user` - default role after registration.

Email confirmation is intentionally not implemented yet; the schema already includes `emailVerifiedAt` for the later verification flow. Project invitations are stored with email, code, status, expiry, and creator so the later email-verification/email-delivery step can send real invitation links without changing the membership model.

## Project creation

New projects are created with a structured setup form rather than only a title. The initial profile stores project type, research field, grant programme, timeline, primary language, visibility, data policy, repository plan, ethics status, sensitive-data flags, and enabled workspace modules. The title field proposes an editable acronym automatically.

Project owners, supervisors, and admins can edit these settings later and manage members from the project settings page. Members are added by registered email, invited by email/code, or can self-join from the dashboard with the project join code. A project member can be promoted to supervisor or removed from the project. The owner cannot be removed.

## Profiles and admin oversight

User profiles now include ORCID, position, affiliation, and profile bio. Team
member profile pages are visible to users who can access the relevant project.
Admins get a separate cabinet with user, project, invitation, content, and audit
log summaries.

## Project-scoped records

Every private project record requires `projectId`. The workspace lists and creates records only inside projects that the current user can access. Legacy records without `projectId` are intentionally excluded from project dashboards until migrated or assigned to a project.

## Open science publishing

Project members can create open science updates from the private editor and either save a draft or publish it. Only records with `status = published` are visible on the public open science page.

## Team workspace

The team page lists real project participants from project membership and stores shared chat messages in `team_messages`. Messages are scoped by `projectId`, so users only see messages from projects they can access.

Large raw experimental files should not be stored as normal MongoDB document fields. Use MongoDB GridFS or a file/object storage layer and keep checksums, provenance, access category, and storage URI in MongoDB.

## File storage

Record uploads use a storage adapter. Local development stores files under
`.data/project-record-files`; production can use Cloudflare R2 through its
S3-compatible API.

Uploads are constrained by file count, file size, MIME type, and extension.
Production deployments should also wire a scanner provider before setting
`FILE_SCAN_MODE=required`.

For local storage:

```bash
FILE_STORAGE_DRIVER=local
```

For Cloudflare R2:

```bash
FILE_STORAGE_DRIVER=r2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_BUCKET=grant-project-files
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_REGION=auto
```

## Security operations

See `docs/security-hardening.md` for the production configuration checklist,
authorization matrix, session invalidation behavior, and remaining hardening
items.

Create the bucket in Cloudflare Dashboard under R2, then create an R2 API token
with `Object Read & Write` scoped to that bucket. R2 uses endpoint
`https://<ACCOUNT_ID>.r2.cloudflarestorage.com` and region `auto`. New uploads get
`r2://<bucket>/<object-key>` storage URIs in MongoDB; existing local files keep
working from their `.data/...` storage URIs.

## Verification

```bash
npm run lint
npx tsc --noEmit
```

## Git

`create-next-app` initialized this folder as a Git repository. Use normal Git flow from this directory:

```bash
git status
git add .
git commit -m "Initial grant project manager app"
```
