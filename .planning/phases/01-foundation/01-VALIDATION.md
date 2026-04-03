---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (Expo default) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx jest --passWithNoTests` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | AUTH-01 | integration | `npx jest --testPathPattern=family` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-02 | integration | `npx jest --testPathPattern=join` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-03 | integration | `npx jest --testPathPattern=profile` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-04 | unit | `npx jest --testPathPattern=session` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NAV-01 | snapshot | `npx jest --testPathPattern=navigation` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NAV-02 | unit | `npx jest --testPathPattern=family-display` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Jest configured in Expo project (included in `create-expo-app` default)
- [ ] Test stubs for auth flow (create family, join family, set name, session persistence)
- [ ] Test stubs for navigation (tab structure, family display)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists after app restart | AUTH-04 | Requires app lifecycle simulation | Close app, reopen, verify user is still logged in |
| Tab navigation renders all 5 tabs | NAV-01 | Visual verification | Open app, verify Home/Messages/Tasks/Location/Profile tabs visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
