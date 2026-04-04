# ez.familyapp

## What This Is

A private family communication app for 5-10 members across iOS and Android. It combines channel-based messaging, location check-ins, and shared task lists into one focused family hub.

## Core Value

Family members can stay connected and coordinated through one app that replaces scattered group chats, location requests, and shared notes.

## Requirements

### Validated

- ✓ Family code signup (creator sets up family, members join via a shared code) — Phase 1
- ✓ Cross-platform mobile (iOS and Android) — Phase 1 (Expo bootstrap)

### Active

- [ ] Channel-based messaging (multiple topic channels like groceries, planning, random)
- [ ] Location check-ins (tap to share current location as a snapshot)
- [ ] Shared task lists (family to-do lists anyone can add to and check off)

### Out of Scope

- Live/always-on location tracking — too complex, battery drain, privacy concerns
- Push notifications — deferred to v2 (nice to have, not essential for launch)
- Direct messages (1-on-1) — channels cover family communication for now
- Web/desktop app — mobile-first, defer to later
- Media/file sharing in messages — text-first for v1
- Task assignment to specific people — shared lists are simpler and sufficient

## Context

- Family of 5-10 people, mix of iPhone and Android users
- Channels give structure to conversations (not one noisy group chat)
- Check-in model chosen over live tracking for simplicity and privacy
- Family code onboarding keeps it simple — no email invites or OAuth complexity
- This is a personal/family project, not a commercial product

## Constraints

- **Platform**: React Native (Expo) — must support both iOS and Android from one codebase
- **Backend**: Azure-native services (Azure SQL, Azure SignalR, Azure Functions / App Service)
- **Infrastructure**: All backend hosted on Azure — no third-party BaaS (Supabase, Firebase, etc.)
- **Privacy**: All data is family-private, no public profiles or discovery

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Channels over single group chat | Family wanted topic-based organization | — Pending |
| Check-in over live location | Simpler, better privacy, no battery drain | — Pending |
| Family code over invite links | Simpler onboarding, code can be shared verbally | — Pending |
| Shared lists over assignable tasks | Keep v1 simple, assignment adds complexity | — Pending |
| Azure-native backend over Supabase | User requires Azure infrastructure — use Azure SQL, SignalR, Functions | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after Phase 1 completion*
