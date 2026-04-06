---
phase: 03-location
plan: 01
subsystem: backend/location
tags: [location, schema, api, azure-sql]
dependency_graph:
  requires: [02-05]
  provides: [member_locations-table, lat-lng-on-messages, share-location-toggle, locations-endpoint, api-client-location-functions]
  affects: [backend/src/routes/messages.ts, backend/src/routes/users.ts, src/lib/api.ts]
tech_stack:
  added: [expo-location, react-native-maps]
  patterns: [MERGE-upsert, LEFT-JOIN-with-privacy-filter, coordinate-validation]
key_files:
  created:
    - backend/src/routes/locations.ts
  modified:
    - app.json
    - package.json
    - backend/src/db/schema.sql
    - backend/src/routes/messages.ts
    - backend/src/routes/users.ts
    - backend/src/index.ts
    - src/lib/api.ts
decisions:
  - "T-3-02 cross-family guard: req.familyId !== familyId check in locations router before any DB query"
  - "T-3-03 privacy filter: locations endpoint nulls out lat/lng/address/updatedAt when shareLocation is false"
  - "MERGE upsert with ml-prefixed inputs to avoid mssql duplicate binding (per RESEARCH Pitfall 5)"
  - "androidGoogleMapsApiKey uses placeholder string literal — Expo Go works without real key; EAS builds require user to substitute"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-06T11:47:10Z"
  tasks_completed: 2
  files_changed: 8
  commits: 2
requirements: [LOC-01, LOC-02, LOC-03]
---

# Phase 3 Plan 01: Location Infrastructure Summary

**One-liner:** Azure SQL schema + REST endpoints for passive location capture on message send, member location map feed, and share_location privacy toggle — with expo-location and react-native-maps installed and configured.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install dependencies + configure plugins | 609ed38 | app.json, package.json |
| 2 | DB schema + backend endpoints + API client | b6269eb | schema.sql, messages.ts, locations.ts, users.ts, index.ts, api.ts |

## What Was Built

### Task 1: Dependencies + Plugin Config
- Installed `expo-location` and `react-native-maps` via `npx expo install`
- Added `expo-location` plugin to `app.json` with iOS `locationWhenInUsePermission` string
- Added `react-native-maps` plugin with `androidGoogleMapsApiKey` placeholder (Expo Go works without a real key; production EAS builds require a real key from Google Cloud Console)

### Task 2: Schema, Endpoints, API Client

**Schema additions (schema.sql):**
- `ALTER TABLE messages ADD latitude FLOAT NULL` and `longitude FLOAT NULL`
- `ALTER TABLE users ADD share_location BIT NOT NULL DEFAULT 1`
- `CREATE TABLE member_locations` with primary key on `user_id`, family index, and foreign keys to users/families/messages

**POST /messages extended (messages.ts):**
- Extracts optional `latitude`/`longitude` from request body
- Validates: lat must be -90..90, lng must be -180..180; rejects with 400 if invalid
- INSERT now includes `latitude` and `longitude` columns
- After insert, if coords present: MERGE upsert into `member_locations` (ml-prefixed inputs to avoid mssql duplicate binding)
- GET /messages SELECT now includes `m.latitude, m.longitude`
- Broadcast payload includes `latitude` and `longitude` for SignalR receivers

**GET /locations/family/:familyId/members (locations.ts — new file):**
- Authenticated route with T-3-02 cross-family access guard
- LEFT JOIN users + member_locations on family_id
- Privacy filter: nulls out lat/lng/address/updatedAt for members with `share_location = 0`

**PATCH /users/me (users.ts):**
- Accepts `{ shareLocation: boolean }`, validates type
- Updates `share_location` column in users table

**index.ts:** imports and mounts `locationsRouter` at `/locations`

**src/lib/api.ts:**
- `Message` interface extended with `latitude?: number | null` and `longitude?: number | null`
- `sendMessage` updated with optional `coords` parameter
- New `MemberLocation` interface
- New `fetchMemberLocations(token, familyId)` function
- New `updateShareLocation(token, shareLocation)` function

## Deviations from Plan

None — plan executed exactly as written. TypeScript compiled cleanly after backend `npm install` (node_modules absent in worktree — Rule 3 auto-fix, not a code issue).

## Threat Mitigations Applied

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-3-02 | `req.familyId !== familyId` check in locations router before DB query |
| T-3-03 | Privacy filter nulls location fields when `shareLocation` is false in both locations endpoint and broadcast payload |

## Known Stubs

None. All endpoints are fully wired. Schema ALTER statements are documentation artifacts — they must be run manually against the Azure SQL database (noted in schema.sql comments).

## Self-Check: PASSED

- [x] `app.json` has expo-location and react-native-maps plugin entries
- [x] `backend/src/db/schema.sql` contains `CREATE TABLE member_locations`, `ALTER TABLE messages ADD latitude`, `ALTER TABLE users ADD share_location`
- [x] `backend/src/routes/locations.ts` exists and exports `locationsRouter`
- [x] `backend/src/routes/messages.ts` contains MERGE upsert and coordinate validation
- [x] `backend/src/routes/users.ts` contains PATCH /users/me
- [x] `backend/src/index.ts` imports and mounts `locationsRouter`
- [x] `src/lib/api.ts` exports `MemberLocation`, `fetchMemberLocations`, `updateShareLocation`, updated `sendMessage`
- [x] TypeScript compiles cleanly (`npx tsc --noEmit` — no errors)
- [x] Commits 609ed38 and b6269eb exist
