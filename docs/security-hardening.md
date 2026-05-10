# Security Hardening Notes

## Production Configuration Checklist

- `AUTH_SECRET`: required outside development, at least 32 random characters. Rotating it invalidates existing signed session cookies.
- `MONGODB_URI` and `MONGODB_DB`: required for persistent production data. Local in-memory fallback must stay disabled in production.
- `ADMIN_EMAILS`: explicit comma-separated allowlist for admin role assignment.
- `FILE_STORAGE_DRIVER`: use `r2` or another production object store for deployed uploads.
- `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_REGION`: required when `FILE_STORAGE_DRIVER=r2`.
- `RECORD_UPLOAD_MAX_FILES` and `RECORD_UPLOAD_MAX_BYTES`: enforce per-request upload limits.
- `FILE_SCAN_MODE` and `FILE_SCAN_PROVIDER`: set `FILE_SCAN_MODE=required` only after a production scanner provider is integrated.
- `ZENODO_API_TOKEN`, `ZENODO_API_BASE_URL`, `ZENODO_DEFAULT_COMMUNITY`: keep sandbox and production tokens separate.
- Reverse proxy/CDN: forward `x-forwarded-for` and preserve or inject `x-request-id`.
- Backups: schedule MongoDB dumps/snapshots and object-storage lifecycle/retention for uploaded files.

## Session Invalidation

- Session cookies are signed with `AUTH_SECRET`; changing this value invalidates all existing sessions.
- User records include `sessionVersion`; password resets increment it, invalidating all older cookies for that user.
- A future logout-all UI should increment `sessionVersion` for the current user or selected target user.

## Authorization Matrix

| Area / actions | Required role | Project scope check |
| --- | --- | --- |
| Auth: `register`, `login`, `requestPasswordReset`, `resetPassword` | Anonymous allowed | Rate-limited; no project scope |
| User prefs/profile: `savePrefs`, `updateProfile`, `logout` | Authenticated user | Own user/session only |
| Project create/join: `createProject`, `createProjectWithTemplate`, `joinProjectWithCode` | Authenticated user | Creates or joins project via controlled code |
| Project settings/members/invites/codes: `updateProjectSettings`, `addProjectMember`, `promoteProjectSupervisor`, `deleteProjectMember`, `createProjectInvite`, `resetProjectJoinCode`, `generateSupervisorJoinCode` | Admin, owner, or supervisor | `canManageProject` / project management helpers |
| Records: `createRecord`, `createRecordVersion`, `createRecordVariant`, `updateRecord`, `changeRecordProcessingStatus`, `addRecordProcessingNote`, `archiveRecord`, `restoreRecord`, `deleteRecord` | Project member or admin | Existing/current record `projectId` must be in accessible projects |
| Record files API: `POST /api/records/[id]/files` | Project member or admin | Record project resolved first, then `getProjectForUser` |
| Open science/Zenodo: `prepareRecordForOpenScience`, `syncRecordZenodoDraft`, `syncRecordZenodoFiles`, `publishRecordZenodo`, `createZenodoNewVersion`, `checkRecordZenodoStatus`, `saveOpenScienceUpdate`, `deleteOpenScienceUpdate` | Project member or admin | Record/update `projectId` must be accessible |
| Team/chat: `postTeamMessage`, `sendChatMessage`, chat API | Project member or admin | `getProjectForUser` or accessible-project membership |
| Planning/budget/research base creates/status updates | Project member or admin | `listProjectsForUser` / `getProjectForUser` |
| Destructive planning/research/report/event changes | Admin, owner, or supervisor where implemented | Prefer `canManageProject`; audit any member-level deletes before production |
| Learning actions in `src/app/learning-actions.ts` | Project member or admin | `getProjectForUser` on submitted `projectId` |
| Admin cabinet | Admin | User role check before admin data access |

## Open Items

- Replace in-memory rate limiting with Redis/Upstash or Mongo-backed counters before multi-instance production deployment.
- Wire a real antivirus/content scanning provider in `scanFileBuffer()`.
- Continue refactoring `src/app/actions.ts` into domain modules once shared authorization wrappers are in place.
- Add integration tests for session lifecycle, role boundaries, project membership enforcement, scoped record CRUD, and public open-science visibility.
