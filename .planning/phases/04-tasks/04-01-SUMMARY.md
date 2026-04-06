---
phase: 04-tasks
plan: "01"
subsystem: backend
tags: [tasks, crud, signalr, azure-sql, express]
dependency_graph:
  requires: []
  provides: [tasks-api, task-signalr-broadcast, family-tasks-group]
  affects: [backend/src/routes/tasks.ts, backend/src/lib/signalr.ts, backend/src/routes/signalr.ts]
tech_stack:
  added: []
  patterns: [persist-first-broadcast, fire-and-forget, idempotent-delete, family-scoped-sql]
key_files:
  created:
    - backend/src/routes/tasks.ts
  modified:
    - backend/src/db/schema.sql
    - backend/src/lib/signalr.ts
    - backend/src/routes/signalr.ts
    - backend/src/index.ts
decisions:
  - "broadcastToFamily private helper centralizes family-tasks-{familyId} group broadcast pattern"
  - "DELETE returns 200 regardless of rowsAffected per D-15 (idempotent)"
  - "PATCH always broadcasts full task record (not delta) per Pitfall 5 in RESEARCH.md"
  - "family-tasks group joined in join-channels endpoint so reconnect (onreconnected) also re-joins"
metrics:
  duration_minutes: 10
  completed_date: "2026-04-06"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 4
---

# Phase 04 Plan 01: Tasks Backend API Summary

**One-liner:** Family-scoped task CRUD API with persist-first SignalR broadcast for real-time sync across all family members.

## What Was Built

Complete tasks backend: Azure SQL DDL, four Express endpoints (GET/POST/PATCH/DELETE), three SignalR broadcast functions, and family-tasks group join on connect/reconnect.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Tasks table DDL + Express router (GET + POST) | e53a257 | schema.sql, routes/tasks.ts, lib/signalr.ts, index.ts |
| 2 | PATCH and DELETE endpoints + SignalR group join | 163eca5 | routes/tasks.ts, routes/signalr.ts |

## Decisions Made

- **broadcastToFamily helper:** Private function centralizing the `family-tasks-{familyId}` group URL construction — all three broadcast exports delegate to it.
- **Idempotent DELETE (D-15):** Returns `{ deleted: true }` with 200 regardless of `rowsAffected` — duplicate deletes are safe.
- **Full record broadcasts (Pitfall 5):** PATCH broadcasts the complete task row selected after update, not a delta — prevents client state divergence.
- **Reconnect-safe group join:** `join-channels` adds user to `family-tasks-{familyId}` so the task group is rejoined whenever `joinChannels()` is called from `onreconnected`.

## Verification

- TypeScript compiles with no errors: confirmed (both tasks)
- All four endpoints use `authenticate` middleware
- All SQL queries filter by `family_id = @familyId` (T-04-01, T-04-04, T-04-06)
- POST validates `name.trim().length > 0 && name.trim().length <= 200` (T-04-02)
- PATCH validates `typeof completed === 'boolean'` (T-04-03)
- All SignalR broadcasts are fire-and-forget with `.catch()` (D-14)

## Deviations from Plan

None - plan executed exactly as written. PATCH and DELETE were implemented in the same file created during Task 1, so Task 2 only required adding the SignalR group join to `signalr.ts`.

## Known Stubs

None.

## Threat Flags

None — all STRIDE mitigations from the threat register are implemented:
- T-04-01/T-04-04/T-04-06: `AND family_id = @familyId` in every SQL query
- T-04-02: name validation on POST
- T-04-03: boolean check on PATCH

## Self-Check: PASSED

- backend/src/routes/tasks.ts: EXISTS
- backend/src/db/schema.sql: contains "CREATE TABLE tasks"
- backend/src/lib/signalr.ts: exports broadcastTaskAdded/Updated/Deleted, contains "family-tasks-"
- backend/src/routes/signalr.ts: contains "family-tasks-" and addUserToGroup call
- backend/src/index.ts: contains "app.use('/tasks', tasksRouter)"
- Commits e53a257 and 163eca5: FOUND
