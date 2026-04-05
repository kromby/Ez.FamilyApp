---
phase: 02-messaging
plan: "02"
subsystem: backend/messaging
tags: [signalr, messages, api, real-time, pagination]
dependency_graph:
  requires: [02-01]
  provides: [message-persistence-api, signalr-integration]
  affects: [frontend-messaging]
tech_stack:
  added: []
  patterns: [persist-first-then-broadcast, keyset-cursor-pagination, signalr-jwt-auth]
key_files:
  created:
    - backend/src/lib/signalr.ts
    - backend/src/routes/signalr.ts
    - backend/src/routes/messages.ts
  modified:
    - backend/src/index.ts
decisions:
  - "SignalR broadcast is fire-and-forget after SQL persist — broadcast failure does not roll back the message (D-09 persist-first)"
  - "Cursor-based pagination uses created_at timestamp as cursor for keyset pagination (no OFFSET) — consistent with D-11"
  - "Channel ownership verified on every message read/write — family isolation enforced at query level"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-05"
  tasks_completed: 2
  files_modified: 4
---

# Phase 02 Plan 02: Message Persistence API and SignalR Integration Summary

**One-liner:** Cursor-paginated message persistence API with Azure SignalR broadcast helper — persist-first flow using JWT-authenticated REST calls to SignalR service.

## What Was Built

### Task 1: SignalR helper library + negotiate/join-channels routes (commit: 7e8b060)

- `backend/src/lib/signalr.ts` — JWT-based SignalR REST helper with 4 exported functions: `generateNegotiatePayload`, `addUserToGroup`, `broadcastToChannel`, `broadcastReaction`
- `backend/src/routes/signalr.ts` — `POST /signalr/negotiate` (returns SignalR URL + access token) and `POST /signalr/join-channels` (adds user to all family channel groups in SignalR)

### Task 2: Message routes + route registration (commit: d40ff77)

- `backend/src/routes/messages.ts` — `POST /messages` (persist to SQL first, update channel preview, broadcast via SignalR) and `GET /messages` (cursor-paginated history with sender name join)
- `backend/src/index.ts` — registered `messagesRouter` at `/messages` and `signalrRouter` at `/signalr`

## Key Design Decisions

1. **Persist-first broadcast (D-09):** `broadcastToChannel` is called with `.catch()` after successful SQL INSERT. SignalR failure logs but does not affect the 201 response — message is already durably stored.
2. **Keyset pagination (D-11):** `GET /messages` uses `created_at < @cursor` with `TOP @pageSize ORDER BY created_at DESC`. No OFFSET — consistent performance as message history grows.
3. **Channel ownership guard:** Every message endpoint verifies `channel.family_id = req.familyId` before any read or write operation.
4. **Channel preview update:** Every `POST /messages` updates `channels.last_message_at` and `last_message_text` (truncated to 200 chars) for the channel list display (D-01).

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria Verification

- [x] POST /messages persists message then broadcasts via SignalR (D-09 persist-first flow)
- [x] GET /messages returns paginated messages with senderName and createdAt (MSG-05, MSG-06)
- [x] Cursor-based pagination with 30-message default page size (D-11)
- [x] SignalR negotiate endpoint returns URL + accessToken
- [x] Join-channels endpoint adds user to all family channel SignalR groups
- [x] Channel last_message_at and last_message_text updated on each message send (D-01)

## Known Stubs

None.

## Self-Check: PASSED
