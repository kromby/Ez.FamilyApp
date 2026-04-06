---
phase: 3
slug: location
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 (backend, per `backend/package.json`) |
| **Config file** | `backend/package.json` ("test": "jest") |
| **Quick run command** | `cd backend && npm test` |
| **Full suite command** | `cd backend && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npm test`
- **After every plan wave:** Run `cd backend && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | LOC-01 | T-3-01 | Validate lat (-90..90) and lng (-180..180) as floats | unit | `cd backend && npm test -- --testPathPattern=messages` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | LOC-01 | — | POST /messages stores lat/lng, upserts member_locations | unit | `cd backend && npm test -- --testPathPattern=messages` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | LOC-02 | T-3-02 | GET /families/:familyId/members/locations verifies req.familyId === params.familyId | unit | `cd backend && npm test -- --testPathPattern=locations` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | LOC-03 | — | Response includes displayName, address, updatedAt | unit | `cd backend && npm test -- --testPathPattern=locations` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | LOC-04 | — | Permission modal shown once, skipped after | manual | Manual — Expo Go device test | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/routes/__tests__/messages.location.test.ts` — stubs for LOC-01 (lat/lng storage + member_locations upsert)
- [ ] `backend/src/routes/__tests__/locations.test.ts` — stubs for LOC-02, LOC-03 (members/locations endpoint)

*Frontend component tests (LocationPermissionModal, MapCard) are manual-only — React Native component testing requires a native test harness not present in this project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Permission modal on first app open | LOC-04 | Requires native permission dialog interaction | Open app fresh → verify modal appears → tap Allow → verify no modal on next open |
| Map pin renders with correct location | LOC-02/LOC-03 | Native map component rendering | Tap member on Location tab → verify map pin appears at correct address |
| Location pin icon in message thread | LOC-01 (D-11) | Visual verification | Send message with location → verify small pin icon visible on message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
