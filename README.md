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

The app works without MongoDB by showing seed records. To persist records, set:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=grant_project_manager
```

## Current routes

- `/` - project dashboard and record creation form
- `/api/records` - `GET` list records, `POST` create record
- `/api/records/[id]` - `PATCH` update record, `DELETE` delete record

## MongoDB collections

Initial collection:

- `project_records`

Planned collections:

- `raw_data_files` - file metadata, checksums, storage URI, relation to dataset/sample/protocol
- `samples` - biological sample inventory and storage metadata
- `decisions` - scientific and operational decision log
- `audit_events` - append-only history of changes
- `users` - team accounts and roles

Large raw experimental files should not be stored as normal MongoDB document fields. Use MongoDB GridFS or a file/object storage layer and keep checksums, provenance, access category, and storage URI in MongoDB.

## Verification

```bash
npm run lint
npm run build
```

## Git

`create-next-app` initialized this folder as a Git repository. Use normal Git flow from this directory:

```bash
git status
git add .
git commit -m "Initial grant project manager app"
```

