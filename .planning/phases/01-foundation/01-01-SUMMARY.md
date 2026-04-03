---
phase: 01-foundation
plan: 01
subsystem: auth
tags: [express, mssql, azure-sql, jwt, nodemailer, otp, typescript, node]

# Dependency graph
requires: []
provides:
  - Azure SQL schema (families, users, otp_requests tables)
  - Express backend with JWT OTP auth endpoints
  - Family code create/join endpoints (rate-limited)
  - User profile creation endpoint
  - JWT middleware (authenticate)
affects: [02-frontend-auth, 02-react-native, 03-messaging, 04-tasks, 04-location]

# Tech tracking
tech-stack:
  added:
    - express ^4.x
    - mssql ^12.2.1 (Azure SQL driver)
    - jsonwebtoken ^9.0.3
    - nodemailer ^8.0.4
    - express-rate-limit ^7.x
    - helmet ^8.x
    - cors ^2.x
    - dotenv ^16.x
    - uuid ^10.x
    - typescript 5.x strict mode
    - "@types/mssql ^9.x"
  patterns:
    - mssql connection pool singleton (getPool) shared across routes
    - MERGE upsert pattern for OTP records (idempotent re-request)
    - OTP replay protection via immediate DELETE after verify
    - Family code collision loop (max 5 attempts)
    - Rate limiting on /families/join (5 req / 15 min)
    - JWT 90-day expiry with {userId, familyId} payload
    - Production managed identity / dev SQL auth config split

key-files:
  created:
    - backend/package.json
    - backend/tsconfig.json
    - backend/.env.example
    - backend/src/index.ts
    - backend/src/db/connection.ts
    - backend/src/db/schema.sql
    - backend/src/lib/familyCode.ts
    - backend/src/lib/mailer.ts
    - backend/src/middleware/authenticate.ts
    - backend/src/routes/auth.ts
    - backend/src/routes/families.ts
    - backend/src/routes/users.ts
  modified: []

key-decisions:
  - "Used jsonwebtoken (not jose) per RESEARCH.md recommendation — project uses HS256 symmetric key, no need for asymmetric jose"
  - "mssql authentication config split: prod uses azure-active-directory-default with empty options{}, dev uses SQL user/pass directly"
  - "POST /families/join intentionally requires no auth — user obtains familyId before registering, then calls /users to complete onboarding"
  - "display_name initialized to empty string on first verify-otp — user completes profile via POST /users"
  - "Added @types/mssql dev dependency (missing from plan, required for TypeScript strict mode)"

patterns-established:
  - "Pattern: mssql getPool() singleton — all routes import and await getPool() rather than maintaining own connections"
  - "Pattern: AuthRequest extends Express Request adding userId and familyId — used across protected routes"
  - "Pattern: parameterized .input() queries throughout — no string concatenation in SQL"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 1 Plan 1: Backend Foundation Summary

**Express/Node.js backend with Azure SQL schema, email OTP auth, 8-char family code create/join, and JWT session management for Azure App Service deployment**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T23:15:24Z
- **Completed:** 2026-04-03T23:18:30Z
- **Tasks:** 2 of 2
- **Files modified:** 12 created

## Accomplishments

- Complete Azure SQL schema for families, users, and otp_requests tables with proper FK constraints
- Full OTP auth flow (POST /auth/request-otp + POST /auth/verify-otp) with MERGE upsert and DELETE-after-use replay protection
- Family code endpoints: POST /families (JWT-protected, collision loop) and POST /families/join (rate-limited 5/15min, no auth)
- POST /users profile creation endpoint with authenticated JWT middleware
- TypeScript strict mode passes with `npm run build` exiting 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend scaffold** - `6289b96` (feat)
2. **Task 2: Auth utilities, middleware, and all API routes** - `158bd74` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `backend/package.json` - Node 20 project with all runtime + dev dependencies
- `backend/tsconfig.json` - ES2020, commonjs, strict mode
- `backend/.env.example` - All 11 required env vars documented
- `backend/src/db/schema.sql` - CREATE TABLE for families, users, otp_requests
- `backend/src/db/connection.ts` - mssql pool singleton, prod managed identity / dev SQL auth
- `backend/src/index.ts` - Express entry with helmet, cors, json, /health endpoint
- `backend/src/lib/familyCode.ts` - 8-char alphanumeric code generator (ABCDEFGHJKMNPQRSTUVWXYZ23456789)
- `backend/src/lib/mailer.ts` - nodemailer SMTP OTP sender
- `backend/src/middleware/authenticate.ts` - JWT verify middleware, AuthRequest interface
- `backend/src/routes/auth.ts` - /request-otp and /verify-otp with OTP replay protection
- `backend/src/routes/families.ts` - /families (protected) and /join (rate-limited)
- `backend/src/routes/users.ts` - /users profile update (protected)

## Decisions Made

- Used `jsonwebtoken` (not `jose`) per RESEARCH.md recommendation — symmetric HS256 key is sufficient for this use case
- Split `mssql` connection config: production uses `azure-active-directory-default` with empty `options: {}` (required by type), dev uses SQL user/password directly via spread
- POST /families/join requires no auth — user gets familyId before completing registration; calls /users afterward to set display_name
- New users created with empty `display_name` and null `family_id` on first OTP verify; profile is completed via POST /users
- Added `@types/mssql` to devDependencies — mssql bundles its own types but they need this package for TypeScript strict type resolution

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mssql TypeScript authentication config type mismatch**
- **Found during:** Task 1 build verification
- **Issue:** `authentication: { type: conditional }` fails because `AzureActiveDirectoryDefaultAuthentication` requires `options: {}` but `DefaultAuthentication` does not have that field — union type fails both
- **Fix:** Split config using object spread: production auth block vs dev user/password block applied conditionally
- **Files modified:** `backend/src/db/connection.ts`
- **Verification:** `npm run build` exits 0
- **Committed in:** `6289b96` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed mssql pool option typo: idleTimeoutMilliseconds → idleTimeoutMillis**
- **Found during:** Task 1 build verification
- **Issue:** TypeScript strict mode flagged `idleTimeoutMilliseconds` as not existing on pool config type
- **Fix:** Renamed to `idleTimeoutMillis` per mssql PoolOpts type definition
- **Files modified:** `backend/src/db/connection.ts`
- **Verification:** `npm run build` exits 0
- **Committed in:** `6289b96` (Task 1 commit)

**3. [Rule 3 - Blocking] Added @types/mssql to devDependencies**
- **Found during:** Task 1 build verification
- **Issue:** mssql module had no type declarations visible to TypeScript strict mode — TS7016 error on all mssql imports
- **Fix:** `npm install --save-dev @types/mssql`
- **Files modified:** `backend/package.json`, `backend/package-lock.json`
- **Verification:** `npm run build` exits 0
- **Committed in:** `6289b96` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bug/type fixes, 1 missing dependency)
**Impact on plan:** All three fixes necessary for TypeScript strict mode compliance. No scope creep — all fixes were in `connection.ts` to match the mssql type definitions exactly.

## Issues Encountered

None beyond the three TypeScript errors above, which were immediately resolved.

## User Setup Required

Before running locally, copy `.env.example` to `.env` and populate:
- `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE`, `AZURE_SQL_USER`, `AZURE_SQL_PASSWORD` — Azure SQL connection details
- `JWT_SECRET` — any long random string for local dev
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP server credentials for OTP email

The schema must be applied to Azure SQL before first run:
```bash
# Run schema.sql against your Azure SQL database
sqlcmd -S $AZURE_SQL_SERVER -d $AZURE_SQL_DATABASE -U $AZURE_SQL_USER -P $AZURE_SQL_PASSWORD -i backend/src/db/schema.sql
```

## Known Stubs

None — all routes are fully implemented. No hardcoded data, no placeholder text, no TODO items in route handlers.

## Next Phase Readiness

- Backend API is complete and compiles cleanly — ready for frontend integration
- All AUTH-0x requirements are implemented
- Frontend (Phase 1 Plan 2 or later) can consume: POST /auth/request-otp, POST /auth/verify-otp, POST /families, POST /families/join, POST /users
- JWT contract established: `{ userId, familyId }` payload, 90-day expiry, HS256
- Blocker: Azure SQL database must be provisioned and schema applied before server can start

---
*Phase: 01-foundation*
*Completed: 2026-04-03*

## Self-Check: PASSED

All created files verified to exist on disk. All task commits verified in git log.

| Check | Status |
|-------|--------|
| backend/src/routes/auth.ts | FOUND |
| backend/src/routes/families.ts | FOUND |
| backend/src/routes/users.ts | FOUND |
| backend/src/lib/familyCode.ts | FOUND |
| backend/src/lib/mailer.ts | FOUND |
| backend/src/middleware/authenticate.ts | FOUND |
| .planning/phases/01-foundation/01-01-SUMMARY.md | FOUND |
| Commit 6289b96 (Task 1) | FOUND |
| Commit 158bd74 (Task 2) | FOUND |
