---
phase: 02
slug: messaging
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + ts-jest |
| **Config file** | `backend/jest.config.ts` — Wave 0 installs |
| **Quick run command** | `cd backend && npx jest --testPathPattern=messaging` |
| **Full suite command** | `cd backend && npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern=messaging`
- **After every plan wave:** Run `cd backend && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | MSG-01 | unit/integration | `jest tests/channels.test.ts -t "GET /channels"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | MSG-02 | unit/integration | `jest tests/channels.test.ts -t "channel creation"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | MSG-03 | integration | `jest tests/messages.test.ts -t "send message"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | MSG-05 | unit/integration | `jest tests/messages.test.ts -t "pagination"` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | MSG-06 | unit | `jest tests/messages.test.ts -t "message shape"` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | MSG-04 | manual-only | — manual | n/a | ⬜ pending |
| 02-04-01 | 04 | 2 | MSG-07 | integration | `jest tests/reactions.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/jest.config.ts` — Jest + ts-jest configuration
- [ ] `backend/tests/channels.test.ts` — stubs for MSG-01, MSG-02
- [ ] `backend/tests/messages.test.ts` — stubs for MSG-03, MSG-05, MSG-06
- [ ] `backend/tests/reactions.test.ts` — stubs for MSG-07
- [ ] Framework install: `cd backend && npm install --save-dev jest ts-jest @types/jest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SignalR real-time delivery to second client | MSG-04 | Requires two active WebSocket connections; unit tests cannot cover this in <30s | 1. Open app on two devices/simulators with same family 2. Send message from device A 3. Verify message appears on device B within 2 seconds |

---

## Environment Dependencies

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| Azure SignalR Service | MSG-03, MSG-04 | Must provision | None — required for real-time |
| @microsoft/signalr (npm) | MSG-03, MSG-04 client | Not yet installed | None |
| @shopify/flash-list (npm) | MSG-05 rendering | Not yet installed | None |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
