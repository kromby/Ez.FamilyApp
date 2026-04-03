# Project Research Summary

**Project:** ez.familyapp
**Domain:** Private family communication and coordination (5-10 members, iOS + Android)
**Researched:** 2026-04-03
**Confidence:** MEDIUM

## Executive Summary

ez.familyapp is a private mobile communication app for small families combining channel-based group messaging, snapshot location check-ins, and shared task lists. Research confirms this is a well-understood problem domain with established patterns: the closest architectural analog is a small-scale team messaging app (Slack-like channels, not iMessage-like threads) combined with a lightweight coordination layer. Experts build this class of app with a managed real-time backend (not a self-hosted WebSocket server), a relational database for task and membership data, and a React Native client using file-based routing. Supabase covers all backend primitives — auth, PostgreSQL, and WebSocket-based Realtime — in a single service well-suited to a 5-10 user scale, eliminating the need for custom server infrastructure in v1.

The recommended approach is Expo SDK 55 (managed workflow) + Supabase + TanStack Query + Zustand, with Expo Router for navigation and FlashList for message rendering. This combination is current, well-documented, and avoids the over-engineering trap (no Redis, no microservices, no CDN, no custom WebSocket server). The data model is relational and straightforward; the primary architectural complexity is in the real-time messaging layer, which Supabase Realtime Broadcast handles correctly. Styling should use plain React Native StyleSheet for v1 to avoid a NativeWind v4/v5 compatibility bet against SDK 55.

The two highest risks are silent real-time message loss (a well-known mobile WebSocket pitfall that requires reconnection logic and foreground re-fetch on app resume) and family code security (brute-forceable if rate limiting and minimum code length are not enforced from day one). Both are tractable with known mitigations. A third risk specific to this project is iOS location permission: asking too early is unrecoverable and kills the check-in feature for those users. All three must be addressed in their respective first-implementation phases, not retroactively.

---

## Key Findings

### Recommended Stack

Expo managed workflow (SDK 55) with Supabase as the sole backend service is the clear recommendation. Expo eliminates native build complexity and provides EAS for cloud-based App Store/Play Store distribution. Supabase covers authentication (email + password), PostgreSQL with Row Level Security for multi-tenant data isolation, and two Realtime modes: Broadcast (correct for messaging) and Postgres Changes (correct for task sync). There is no need for a custom Node.js server, a separate chat service, or Redis at this scale.

**Core technologies:**
- **Expo SDK 55 + React Native 0.83:** Cross-platform runtime — managed workflow removes Xcode/Gradle from the critical path; New Architecture on by default
- **Expo Router v4:** File-based navigation — default in new Expo projects; tab + stack layout maps directly to the app's screen structure
- **Supabase (supabase-js ^2.x):** Auth + database + real-time — single service replaces auth server, API server, and WebSocket infrastructure; RLS enforces family data isolation at the DB level
- **TanStack Query v5:** Server state management — handles caching, background refresh, and error states; works in React Native with focus-refetch hooks
- **Zustand v5:** Client/UI state — lightweight store for session, selected channel, and transient UI state; no Redux boilerplate
- **FlashList ^1.x:** Message list rendering — mandatory replacement for FlatList; significantly faster for 100+ message lists
- **expo-location:** Location check-ins — just-in-time permission request; snapshot check-in, no continuous tracking
- **React Native StyleSheet (plain):** Styling for v1 — avoids NativeWind v4/v5 SDK 55 compatibility uncertainty; add NativeWind in v2 once pairing stabilizes

### Expected Features

Research surveyed Life360, FamilyWall, Cozi, OurHome, OurFamilyWizard, Kinzoo, FabFam, and Picniic to establish the feature landscape.

**Must have (table stakes):**
- Real-time channel messaging with persistence — core communication primitive; every competitor has it
- Cross-platform iOS + Android — mixed-device families are the norm
- Family group setup with invite/join code — entry point; nothing works without it
- Shared task lists with check-off — universal coordination tool across all competitors
- Message timestamps and ordering — conversations are unreadable without these
- Basic profile identity (display name) — attribution in messages, tasks, and check-ins

**Should have (differentiators):**
- Channel-based messaging (not single group chat) — primary structural differentiator; reduces noise vs. WhatsApp/iMessage groups
- Location check-in (tap-to-share snapshot) — privacy-respecting differentiator vs. Life360's live tracking
- Unread message badges per channel — helps triage without opening all channels
- Per-channel notification controls — prevents alert fatigue (requires push infrastructure first)

**Defer (v2+):**
- Push notifications — 3x retention impact but requires APNs/FCM setup; ship core first
- Message reactions — ergonomic improvement; zero-risk defer
- Offline message queue — valuable for spotty coverage; adds sync complexity
- Multiple named task lists — useful but one list works to start
- Check-in with note/context — small enhancement, can land in v1.1

**Explicitly out of scope (skip entirely):**
- Live/continuous GPS tracking — battery drain, privacy concerns; not this app's position
- Direct messages (1:1) — adds moderation UX and notification routing for no meaningful gain at 5-10 users
- Media/photo sharing — storage costs and CDN requirements are disproportionate for v1
- Shared calendar — Cozi's strength; Google Calendar already solves this
- Web/desktop app — mobile-only for v1
- Gamification, AI features, public profiles, in-app payments

### Architecture Approach

The appropriate architecture is a three-tier client / backend / database model — not microservices. At 5-10 concurrent users, a single Supabase project handles all real-time, REST, and storage needs without a custom server. The client uses WebSocket (Supabase Realtime Broadcast) for message delivery and plain REST (Supabase client queries) for tasks and check-ins. All data is isolated per-family via Row Level Security policies scoped to `family_id`.

**Major components:**
1. **React Native client (Expo)** — all UI, local state, WebSocket subscription management, optimistic updates
2. **Supabase Auth + RLS** — family creation, join-code validation, JWT sessions, row-level data isolation
3. **Supabase Realtime Broadcast** — WebSocket pub/sub for channel messaging; clients subscribe to `channel:{id}` topics
4. **Supabase PostgreSQL** — persistent storage for all entities: `families`, `users`, `channels`, `messages`, `check_ins`, `task_lists`, `tasks`
5. **Supabase Realtime Postgres Changes** — optional subscription for task list sync (simpler than Broadcast for CRUD-driven features)

**Key patterns:**
- Cursor-based pagination for message history (stable under live inserts; offset pagination breaks)
- Server-assigned timestamps for message ordering (never trust client `Date.now()`)
- `expo-secure-store` for JWT storage (not AsyncStorage, which is unencrypted on Android)
- Re-fetch on `AppState` foreground transition before waiting for subscription resume
- Read cursors stored server-side as `{user_id, channel_id, last_read_message_id}` (design from day one; retrofitting is painful)

### Critical Pitfalls

1. **Silent real-time message loss** — WebSocket drops silently on mobile (WiFi/cellular switch, app backgrounded). Prevention: use Supabase Realtime's managed connection lifecycle; implement optimistic "pending" state with server acknowledgment; re-fetch missed messages on `AppState` foreground transition. Address in the first messaging phase.

2. **Family code brute-force** — short or numeric codes without rate limiting are enumerable. Prevention: 8-character alphanumeric code (36^8 ≈ 2.8T combinations); rate-limit join attempts to 5 per 15 minutes per IP; return identical errors for invalid vs. expired codes. Address in the auth phase.

3. **Stale data on foreground return** — subscriptions tear down when backgrounded; on resume, UI shows stale cache until a new live event arrives. Prevention: always fire a REST catch-up fetch on `AppState` active transition before relying on subscription replay. Address in messaging phase; revisit in check-in phase.

4. **Location permission denied at wrong time** — iOS cannot re-prompt after a denial; users who deny during onboarding permanently break the check-in feature. Prevention: request `expo-location` permission only when the user taps "Share My Location" for the first time; show an in-app explanation before the system dialog; handle denied state with a Settings deep-link. Address in the check-in phase.

5. **Unread count permanently wrong** — per-device unread tracking diverges across devices and survives app reinstalls incorrectly. Prevention: store read cursors server-side from day one (`user_id + channel_id + last_read_message_id`); fetch fresh counts on app open. Address during messaging schema design — retrofitting this is expensive.

---

## Implications for Roadmap

Based on the dependency graph in FEATURES.md and the build order in ARCHITECTURE.md, a five-phase structure is recommended. The ordering follows a hard dependency chain: auth gates everything; messaging validates the hardest technical piece early; tasks and check-ins are pure REST and low-risk; polish addresses the pitfalls that surface with real usage.

### Phase 1: Foundation — Auth, Family Setup, Navigation Shell

**Rationale:** Nothing works without family membership. Auth + family code is the dependency root of the entire feature graph. The navigation shell (tabs, screens) must exist before any feature can be developed against it. Android test discipline should be established here, not later.
**Delivers:** Working Expo app with Supabase auth, family create/join flow, navigation shell (tabs for channels, check-in, tasks), user profile creation, and JWT stored securely in `expo-secure-store`.
**Addresses:** Family group setup, invite/join code, basic profile identity (FEATURES.md table stakes)
**Avoids:** Family code brute-force (Pitfall 2) — rate limiting and 8-char alphanumeric code from day one; onboarding abandonment (Pitfall 9) — code entry as first screen, minimal friction; Android divergence (Pitfall 8) — test on real Android hardware from the first screen
**Research flag:** Standard patterns — Supabase Auth + Expo is an official quickstart; no deeper research needed

### Phase 2: Channel Messaging

**Rationale:** Messaging is the core value proposition and the highest-risk technical piece (real-time, WebSocket, connection management). Validate it immediately after auth so any architectural rework happens early, not after tasks and check-ins are built on top.
**Delivers:** Real-time channel messaging with Supabase Realtime Broadcast, message persistence, FlashList rendering, cursor-based pagination, server-assigned timestamps, per-channel unread badges with server-side read cursors.
**Addresses:** Real-time messaging, message persistence, timestamps + ordering, unread badges (FEATURES.md table stakes + differentiators)
**Avoids:** Silent message loss (Pitfall 1) — AppState reconnection + optimistic pending state; wrong message ordering (Pitfall 5) — server `created_at DEFAULT now()`; permanently wrong unread count (Pitfall 7) — server-side read cursor schema designed here; stale foreground data (Pitfall 3) — REST catch-up fetch on foreground
**Research flag:** Needs deeper research — Supabase Broadcast reconnection behavior and message gap recovery patterns are not fully documented; validate sequence number / cursor re-fetch approach before implementation

### Phase 3: Shared Task Lists

**Rationale:** Tasks are pure REST CRUD with no real-time complexity. After messaging proves the Supabase + TanStack Query integration, tasks are a low-risk addition that completes the coordination primitive set. Multiple named lists are a minor enhancement and can be included here or deferred to v1.1.
**Delivers:** Task lists with add/check-off/delete, TanStack Query for optimistic updates, server-side atomic toggle to handle concurrent edits, multiple named lists (or single list if scope is tight).
**Addresses:** Shared task lists with check-off, multiple lists differentiator (FEATURES.md)
**Avoids:** Concurrent edit conflicts (Pitfall 6) — SQL atomic `UPDATE ... SET is_completed = NOT is_completed` rather than read-then-write
**Research flag:** Standard patterns — REST CRUD + TanStack Query + optimistic updates is well-documented; no deeper research needed

### Phase 4: Location Check-Ins

**Rationale:** Check-in is the key differentiator from generic group chat and is technically simple (REST POST + map display). It should come after messaging and tasks are stable because it introduces the only device permission flow in the app, which must be handled carefully.
**Delivers:** Tap-to-share location check-in using `expo-location`, check-in history visible to family, GPS accuracy indicator, map display of latest check-ins per member.
**Addresses:** Location check-in differentiator, check-in with note/context (FEATURES.md)
**Avoids:** Permission denied at wrong time (Pitfall 4) — just-in-time permission with in-app explanation; GPS accuracy trust erosion (Pitfall 12) — show accuracy radius; live location conflation (Architecture anti-pattern 3) — display timestamps clearly
**Research flag:** Standard patterns — `expo-location` + Supabase REST is straightforward; map display via react-native-maps may need version compatibility check at implementation time

### Phase 5: Polish and Reliability

**Rationale:** After all four core features exist and the family can use the app, this phase hardens the rough edges that research flagged as adoption killers: offline behavior, channel discipline, and cross-platform consistency.
**Delivers:** Offline cached display of last N messages per channel (expo-sqlite), "offline" banner, default channel set on family creation, Android keyboard and back-button fixes, seen/delivered indicators on messages.
**Addresses:** Seen/delivered indicators (FEATURES.md table stakes), offline graceful degradation (PITFALLS.md minor)
**Avoids:** Offline blank screen (Pitfall 10); channel proliferation (Pitfall 11) — admin-only creation + default channels; Android divergence (Pitfall 8) — explicit Android regression pass
**Research flag:** Standard patterns — expo-sqlite caching and offline queue patterns are well-documented

### Phase 6: Push Notifications (v2)

**Rationale:** Research confirms push notifications deliver 3x retention improvement, but APNs/FCM setup, server-side fan-out, and notification permission flows are out of scope for v1. The data model (messages, check-ins) should be designed with notification fan-out in mind from Phase 2 so this phase is an addition, not a rework.
**Delivers:** Push notifications for new messages and check-ins, per-channel notification controls.
**Addresses:** Notification controls, check-in notification (FEATURES.md differentiators)
**Research flag:** Needs deeper research — Expo push notification service vs. direct APNs/FCM, server-side fan-out options with Supabase Edge Functions; this is the most operationally complex phase

### Phase Ordering Rationale

- Auth (Phase 1) is a hard prerequisite for every API call in every subsequent phase
- Messaging (Phase 2) comes immediately after auth because it carries the highest technical risk (real-time, connection management) and validates the Supabase Realtime integration before anything else is built on top of it
- Tasks (Phase 3) and Check-ins (Phase 4) are pure REST and independently addressable once auth exists; tasks come first because they have no device permission complexity
- Polish (Phase 5) is placed after all features exist so real usage can surface the actual rough edges rather than speculating about them during construction
- Push notifications (Phase 6) are explicitly deferred to v2 per FEATURES.md analysis; the architecture must accommodate them passively but not implement them in v1

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Messaging):** Supabase Realtime Broadcast reconnection behavior, message gap recovery, and sequence number tracking are not covered in official docs with enough specificity; validate before writing real-time connection management code
- **Phase 6 (Push Notifications):** Expo push service vs. direct APNs/FCM, Supabase Edge Function fan-out patterns, and notification permission UX on both platforms all need research before planning this phase

Phases with standard patterns (skip research-phase):
- **Phase 1 (Auth/Foundation):** Supabase Auth + Expo has an official quickstart; family code is a custom but simple pattern
- **Phase 3 (Task Lists):** REST CRUD + TanStack Query + optimistic updates is textbook
- **Phase 4 (Check-ins):** expo-location + REST is straightforward; map display is well-documented
- **Phase 5 (Polish):** expo-sqlite caching and offline queue patterns are well-established

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core choices (Expo SDK 55, Supabase, TanStack Query, Zustand) verified via official docs and multiple sources. NativeWind v4/v5 SDK 55 compatibility is the only uncertain element — mitigated by plain StyleSheet recommendation for v1. |
| Features | MEDIUM | Based on competitor analysis across 8 apps; specific UX patterns are consistent across sources. Exact feature prioritization reflects this app's stated scope. |
| Architecture | MEDIUM | Three-tier pattern and data model are well-supported. Supabase Realtime Broadcast specifics (reconnection, gap recovery) are less documented than the happy path. |
| Pitfalls | MEDIUM-HIGH | Most pitfalls sourced from documented incidents (Firebase SDK GitHub issues, OWASP Mobile Top 10, Nielsen Norman Group permission research). Real-world validation from production apps. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **NativeWind v5 / SDK 55 compatibility:** Verify current status at project start before committing to plain StyleSheet permanently. If v5 is stable by then, consider adopting earlier.
- **Supabase Realtime Broadcast reconnection and gap recovery:** Official docs cover the happy path; the specific behavior on mobile network transitions and app foreground return needs validation against the SDK before Phase 2 implementation.
- **Supabase free tier limits:** Confirm current free tier limits (connections, Realtime message rate, DB size) are sufficient for 5-10 users before launch. The research indicates they are, but check at project start.
- **expo-location accuracy on Android emulators:** GPS simulation on Android emulators is unreliable; real device testing is essential for Phase 4. Budget accordingly.

---

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Release Announcement](https://expo.dev/changelog/sdk-55) — framework version, New Architecture defaults
- [Supabase + Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — auth + Supabase integration patterns
- [Supabase Realtime Broadcast Guide](https://supabase.com/docs/guides/realtime/broadcast) — messaging architecture
- [Socket.IO Rooms Documentation](https://socket.io/docs/v3/rooms/) — room isolation patterns (applicable to Supabase channel design)
- [expo-location Documentation](https://docs.expo.dev/versions/latest/sdk/location/) — permission flow, accuracy handling

### Secondary (MEDIUM confidence)
- [React Native Tech Stack for 2025 — Galaxies.dev](https://galaxies.dev/article/react-native-tech-stack-2025) — stack validation
- [Realtime apps with React Native and WebSockets — Ably](https://ably.com/topic/websockets-react-native) — connection management pitfalls
- [Designing chat architecture for reliable message ordering — Ably](https://ably.com/blog/chat-architecture-reliable-message-ordering) — ordering pitfall
- [6 Best Family Messaging Apps in 2025](https://family.justalk.com/blog/list-of-best-family-messaging-apps.html) — feature landscape
- [FamilyWall vs Cozi comparison](https://rigorousthemes.com/blog/familywall-vs-cozi/) — competitor features
- [3 Design Considerations for Mobile Permission Requests — Nielsen Norman Group](https://www.nngroup.com/articles/permission-requests/) — location permission pitfall
- [Onboarding That Works — Reteno](https://reteno.com/blog/won-in-60-seconds-how-top-apps-nail-onboarding-to-drive-subscriptions) — onboarding pitfall (74% / 80% abandonment stats)
- [Push Notification Statistics 2025 — Business of Apps](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/) — 3x retention stat
- [OWASP Mobile Top 10 2024 — GetAstra](https://www.getastra.com/blog/mobile/owasp-mobile-top-10-2024-a-security-guide/) — security pitfalls

### Tertiary (LOW confidence — needs validation at implementation)
- [NativeWind vs Tamagui vs twrnc 2026 — pkgpulse](https://www.pkgpulse.com/blog/nativewind-vs-tamagui-vs-twrnc-react-native-styling-2026) — NativeWind v5 status (pre-release as of research date)
- [Supabase Group Invite Code Discussion](https://github.com/orgs/supabase/discussions/26337) — family code implementation pattern

---

*Research completed: 2026-04-03*
*Ready for roadmap: yes*
