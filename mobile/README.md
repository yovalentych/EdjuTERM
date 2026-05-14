# Research Navigator Mobile

Expo React Native companion app for the Grant Project Manager web application.

This app is intentionally not a full clone of the desktop web UI. It starts as a mobile helper for:

- project status
- quick diary/capture notes
- budget lite
- mobile purchase-request drafts
- profile/API diagnostics

## Run with Expo Go

```bash
cd mobile
npm run start:go
```

Scan the QR code with Expo Go.

For API access from a real phone, use your computer LAN IP instead of `localhost`:

```bash
cp .env.example .env
```

Then set:

```text
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:3000
```

## Current State

The first version uses local mock data and a prepared API client in `lib/api.ts`.
Next step is adding mobile JSON endpoints to the Next.js app for auth, projects, diary, and budget-lite actions.
