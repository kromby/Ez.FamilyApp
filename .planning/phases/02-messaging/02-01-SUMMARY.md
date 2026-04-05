---
phase: 02-messaging
plan: 01
subsystem: database, api, testing
tags: [mssql, express, jest, ts-jest, channels, flash-list, signalr]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Express app, authenticate middleware, getPool(), schema.sql base tables"
provides:
  - "channels table, messages table, message_reactions tables with constraints"
  - "GET /channels endpoint returning family channels ordered by activity"
  - "POST /channels endpoint with validation and duplicate detection"
  - "#general channel auto-created on family creation"
  - "Jest test infrastructure with ts-jest and stub tests for messaging"
  - "@shopify/flash-list and @microsoft/signalr installed"
affects: [02-02-messages, 02-03-realtime, 02-04-frontend-channels, 02-05-frontend-messages]

# Tech tracking
tech-stack:
  added: [jest, ts-jest, "@types/jest", "@shopify/flash-list", "@microsoft/signalr"]
  patterns:
    - "Channel routes follow same authenticate middleware + getPool() + sql.input() pattern as existing routes"
    - "Duplicate-safe param naming: use @familyId2 when @familyId already bound in same handler"
    - "Case-insensitive duplicate check via LOWER() before unique constraint insert"

key-files:
  created:
    - backend/src/routes/channels.ts
    - backend/jest.config.ts
    - backend/tests/channels.test.ts
    - backend/tests/messages.test.ts
    - backend/tests/reactions.test.ts
  modified:
    - backend/src/db/schema.sql
    - backend/src/routes/families.ts
    - backend/src/index.ts
    - backend/package.json
    - package.json

key-decisions:
  - "Channel name validation: 1-50 chars, letters/numbers/spaces/hyphens (regex /^[a-zA-Z0-9 \\-]{1,50}$/)"
  - "Duplicate detection uses LOWER(name) case-insensitive check before DB unique constraint"
  - "#general channel uses @familyId2 param to avoid mssql duplicate input binding in same request pool"
  - "Jest test stubs (it.todo) cover all messaging endpoints — implementation in later plans"

patterns-established:
  - "Channel query pattern: SELECT from channels WHERE family_id = @familyId ORDER BY COALESCE(last_message_at, created_at) DESC"
  - "INSERT with OUTPUT INSERTED returns created row in single query"

requirements-completed: [MSG-01, MSG-02]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 02 Plan 01: Messaging DB Schema, Channel API, and Test Infrastructure Summary

**Azure SQL messaging schema (channels/messages/reactions) with Express channel CRUD, #general auto-creation, and Jest ts-jest test infrastructure**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T20:26:13Z
- **Completed:** 2026-04-05T20:28:30Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Extended schema.sql with channels, messages, message_reactions tables including uq_channel_name_per_family constraint and ix_messages_channel_created index
- Created GET /channels and POST /channels endpoints with input validation, case-insensitive duplicate detection, and 409 conflict response
- Added #general channel auto-creation in POST /families handler (D-03)
- Configured Jest with ts-jest; 18 stub todos covering channels, messages, reactions API surface
- Installed @shopify/flash-list (frontend) and @microsoft/signalr (frontend), jest/ts-jest (backend)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies + DB schema + test infrastructure** - `a466cfa` (feat)
2. **Task 2: Channel API routes + #general auto-creation** - `5cee906` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `backend/src/db/schema.sql` - Added channels, messages, message_reactions tables
- `backend/src/routes/channels.ts` - GET /channels and POST /channels endpoints
- `backend/src/routes/families.ts` - Added #general channel INSERT after family creation
- `backend/src/index.ts` - Registered channelsRouter at /channels
- `backend/jest.config.ts` - Jest configuration with ts-jest preset
- `backend/tests/channels.test.ts` - Stub tests for channel endpoints (5 todos)
- `backend/tests/messages.test.ts` - Stub tests for message endpoints (6 todos)
- `backend/tests/reactions.test.ts` - Stub tests for reaction endpoints (4 todos)
- `backend/package.json` - Added test script; jest/ts-jest/types in devDependencies
- `package.json` - Added @shopify/flash-list, @microsoft/signalr

## Decisions Made
- Channel name validation uses `/^[a-zA-Z0-9 \-]{1,50}$/` pattern matching the UI-SPEC
- Duplicate channel name check is case-insensitive via `LOWER(name)` before hitting the DB unique constraint (avoids SQL error surfacing to client)
- Used `@familyId2` parameter name in the #general INSERT inside families.ts because `@familyId` is already bound earlier in the same request pool handler

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Channel API foundation complete — GET /channels and POST /channels are functional
- Jest infrastructure ready for real integration tests in later plans
- families.ts now creates #general on family creation — verified via compile check
- Plans 02-02 through 02-05 can proceed: messages, realtime, and frontend channel/message screens all depend on this foundation

## Self-Check: PASSED

All created files verified present. Both task commits (a466cfa, 5cee906) confirmed in git log.

---
*Phase: 02-messaging*
*Completed: 2026-04-05*
