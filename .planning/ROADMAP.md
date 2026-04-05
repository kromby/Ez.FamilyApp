# Roadmap: ez.familyapp

## Overview

Four phases from zero to a working family app. Phase 1 stands up the Azure backend, the navigation shell, and the auth flow — nothing else is possible without it. Phase 2 delivers the core communication feature (channel messaging with real-time delivery via Azure SignalR), which carries the highest technical risk and should be validated early. Phase 3 adds passive location capture (hooked into message sending) and last-known-location display. Phase 4 completes the coordination layer with shared task lists. After Phase 4, the family can use the app end-to-end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Azure backend scaffold, authentication, family code onboarding, and navigation shell
- [ ] **Phase 2: Messaging** - Channel-based real-time messaging via Azure SignalR with persistence and reactions
- [ ] **Phase 3: Location** - Passive location capture on message send and last-known-location display per member
- [ ] **Phase 4: Tasks** - Shared family task list with add, check-off, delete, and real-time sync

## Phase Details

### Phase 1: Foundation
**Goal**: Family members can create or join a family and open the app to a working navigation shell
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. User can create a new family and receive a shareable family code
  2. User can join an existing family by entering a family code and see the family name in the app
  3. User can set a display name during signup and see it displayed in the app
  4. User reopens the app after closing it and is still logged in (session persists)
  5. App shows tab-based navigation with messages, tasks, location, and profile tabs
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Azure SQL schema + Express API (auth, families, users)
- [x] 01-02-PLAN.md — Expo bootstrap, design tokens, session store, root layout
- [x] 01-03-PLAN.md — Auth/onboarding screens (welcome through set-name) + API client
- [x] 01-04-PLAN.md — 5-tab shell and all tab screens (Home, Messages, Tasks, Location, Profile)

**UI hint**: yes

### Phase 2: Messaging
**Goal**: Family members can communicate in real time through named channels
**Depends on**: Phase 1
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07
**Success Criteria** (what must be TRUE):
  1. User can see a list of channels belonging to their family and tap one to open it
  2. User can create a new channel with a name and it appears in the channel list
  3. User sends a text message and it appears instantly for other family members (real-time delivery)
  4. User opens a channel and sees message history from previous sessions, with each message showing sender name and timestamp
  5. User can react to a message with an emoji and other family members see the reaction
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — DB schema extensions + Channel API + test infrastructure + npm installs
- [x] 02-02-PLAN.md — Message API routes + SignalR backend (negotiate, broadcast, groups)
- [x] 02-03-PLAN.md — Frontend navigation conversion + channel list + create channel modal
- [x] 02-04-PLAN.md — Message thread screen + SignalR client hook + optimistic sends
- [ ] 02-05-PLAN.md — Emoji reactions (backend + frontend) + human verification checkpoint

**UI hint**: yes

### Phase 3: Location
**Goal**: Family members can passively share their location and tap any member to see where they last were
**Depends on**: Phase 2
**Requirements**: LOC-01, LOC-02, LOC-03, LOC-04
**Success Criteria** (what must be TRUE):
  1. When a user sends a message for the first time, the app requests location permission with an in-app explanation before the system dialog appears
  2. User sends a message and their location is silently captured and stored alongside it (no extra step required)
  3. User taps on a family member's name and sees that member's last known location on a map or as coordinates
  4. The last-known-location display shows the member's name, location, and how long ago it was recorded
**Plans**: TBD
**UI hint**: yes

### Phase 4: Tasks
**Goal**: Family members can maintain a shared task list that stays in sync across all devices
**Depends on**: Phase 1
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
**Success Criteria** (what must be TRUE):
  1. User can open the tasks tab and see the family's shared task list
  2. User can add a task by typing a name and tapping add — it appears immediately for all family members
  3. User can tap a task to check it off and the completed state is visible to all family members
  4. User can delete a task and it disappears for all family members
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete |  |
| 2. Messaging | 3/5 | In Progress|  |
| 3. Location | 0/? | Not started | - |
| 4. Tasks | 0/? | Not started | - |
