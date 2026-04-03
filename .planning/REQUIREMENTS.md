# Requirements: ez.familyapp

**Defined:** 2026-04-03
**Core Value:** Family members can stay connected and coordinated through one app that replaces scattered group chats, location requests, and shared notes.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Onboarding

- [ ] **AUTH-01**: User can create a new family and receive a family code
- [ ] **AUTH-02**: User can join an existing family by entering a family code
- [ ] **AUTH-03**: User can set a display name during signup
- [ ] **AUTH-04**: User session persists across app restarts

### Messaging

- [ ] **MSG-01**: User can view a list of channels in their family
- [ ] **MSG-02**: User can create a new channel with a name
- [ ] **MSG-03**: User can send a text message in a channel
- [ ] **MSG-04**: User can see messages from other family members in real-time
- [ ] **MSG-05**: Message history persists and loads when opening a channel
- [ ] **MSG-06**: Messages display sender name and timestamp
- [ ] **MSG-07**: User can react to a message with an emoji

### Tasks

- [ ] **TASK-01**: User can view a shared family task list
- [ ] **TASK-02**: User can add a task to the list
- [ ] **TASK-03**: User can check off a completed task
- [ ] **TASK-04**: User can delete a task from the list
- [ ] **TASK-05**: Task list syncs across all family members

### Location

- [ ] **LOC-01**: User's location is automatically captured when they send a message
- [ ] **LOC-02**: User can tap on a family member to see their last known location
- [ ] **LOC-03**: Last known location displays who, where, and how old the location is
- [ ] **LOC-04**: Location permission is requested when user first sends a message

### Navigation & Shell

- [ ] **NAV-01**: App has tab-based navigation (messages, tasks, location, profile)
- [ ] **NAV-02**: App shows which family the user belongs to

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Messaging Enhancements

- **MSG-08**: Seen/delivered indicators on messages
- **MSG-09**: Messages composed offline are queued and sent on reconnect
- **MSG-10**: Unread message badges per channel

### Task Enhancements

- **TASK-06**: Multiple named task lists (groceries, projects, etc.)

### Notifications

- **NOTF-01**: Push notifications for new messages
- **NOTF-03**: Per-channel notification controls

### Profile Enhancements

- **PROF-01**: User can upload an avatar image

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Live/always-on location tracking | Battery drain, privacy concerns, high complexity |
| Direct messages (1-on-1) | Channels cover family communication; DMs add moderation complexity |
| Media/file sharing in messages | Storage costs, CDN complexity; text-first for v1 |
| Task assignment to people | Shared lists are simpler and sufficient |
| Shared calendar / events | Extreme scope expansion; Google Calendar exists |
| Gamification / points | Condescending for adult families |
| Meal planning / recipes | Orthogonal to core value |
| Web / desktop app | Mobile-first; defer to later |
| AI features | Not relevant to casual family app |
| Public profiles / discovery | Private family app, no discoverability |
| In-app payments / premium | Personal project, not commercial |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| MSG-01 | Phase 2 | Pending |
| MSG-02 | Phase 2 | Pending |
| MSG-03 | Phase 2 | Pending |
| MSG-04 | Phase 2 | Pending |
| MSG-05 | Phase 2 | Pending |
| MSG-06 | Phase 2 | Pending |
| MSG-07 | Phase 2 | Pending |
| LOC-01 | Phase 3 | Pending |
| LOC-02 | Phase 3 | Pending |
| LOC-03 | Phase 3 | Pending |
| LOC-04 | Phase 3 | Pending |
| TASK-01 | Phase 4 | Pending |
| TASK-02 | Phase 4 | Pending |
| TASK-03 | Phase 4 | Pending |
| TASK-04 | Phase 4 | Pending |
| TASK-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 — traceability populated after roadmap creation*
