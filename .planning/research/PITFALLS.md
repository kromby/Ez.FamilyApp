# Domain Pitfalls

**Domain:** Family communication app (channel messaging, location check-ins, shared task lists, family code signup, cross-platform mobile)
**Researched:** 2026-04-03

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or a product family members stop using.

---

### Pitfall 1: Real-Time Connection Lost Silently — Messages Appear Delivered But Aren't

**What goes wrong:** The WebSocket or real-time subscription silently disconnects (phone switches from WiFi to cellular, screen locks, app is backgrounded). The UI shows no error. The user types a message, hits send, and the message is queued in memory — but never delivered. When the app reconnects, there is no replay, so those messages are gone.

**Why it happens:** Raw WebSockets have no built-in heartbeat, no message acknowledgment, and no replay buffer. Mobile OS aggressively throttles background network activity. A dropped connection can go undetected by the client for minutes.

**Consequences:** Silent data loss. Family members post messages that others never see. Trust in the app collapses fast.

**Warning signs:**
- Sending a message right after unlocking the phone sometimes fails
- Messages appear sent on sender's device but absent on others
- UI does not show a "reconnecting" or "offline" state

**Prevention:**
- Use a managed real-time service (Supabase Realtime, Ably, or similar) that handles connection lifecycle, heartbeats, and message replay — do not roll your own WebSocket reconnection logic
- Implement optimistic UI with explicit acknowledgment: message stays in "pending" state until server confirms receipt
- Track the last-received message sequence number on the client; on reconnect, request all messages since that sequence number
- Listen to `AppState` changes in React Native / Flutter and force-reconnect when the app comes to foreground

**Phase to address:** Core real-time messaging implementation (first messaging phase)

---

### Pitfall 2: Family Code Is Brute-Forceable

**What goes wrong:** A short alphanumeric family code (e.g., 6 characters) with no rate limiting can be enumerated by an attacker making automated requests. At 36^6 possible combinations (~2.1 billion), this sounds safe — but a 6-character numeric-only code (1 million combinations) or a 4-character code (1.7 million alphanumeric) can be exhausted in minutes with no protection.

**Why it happens:** Teams treat the family code as a secret URL, not as an authentication mechanism. The join endpoint has no rate limiting and returns a clear success/failure response that confirms whether a code is valid.

**Consequences:** Random people or bots can join a private family space. All messages, location check-ins, and tasks become visible to strangers.

**Warning signs:**
- Join endpoint accepts unlimited attempts per IP
- Numeric-only or short codes (4-6 characters) without additional entropy
- API response distinguishes "invalid code" from "expired code" (gives attacker information)

**Prevention:**
- Use codes of at least 8 characters with both letters and numbers (36^8 ≈ 2.8 trillion combinations)
- Rate-limit join attempts per IP: 5 attempts per 15 minutes maximum
- Add exponential backoff for repeated failures from the same source
- Optionally: codes expire after 24-48 hours (creator generates a fresh one when needed)
- Return identical error responses for invalid vs. expired codes to prevent enumeration

**Phase to address:** Authentication and family setup phase

---

### Pitfall 3: Stale Data When App Returns to Foreground

**What goes wrong:** A family member opens the app after an hour. The channel list and message feed show data from when they last had the app open. New messages, check-ins, and task changes made by others are not visible until they scroll or force-refresh. In the worst case (Firestore-specific), fresh data takes up to 90 seconds to arrive after backgrounding.

**Why it happens:** Real-time subscriptions are torn down when the app is backgrounded. When the user returns, the subscription reconnects but does not automatically backfill the gap. The UI displays cached (stale) data until the next live event arrives.

**Consequences:** Family members see outdated task states, miss check-ins, and assume conversations are quiet when they are not. Erodes confidence in the app.

**Warning signs:**
- Opening the app after 30+ minutes shows no new content
- Pull-to-refresh always shows new data that should have appeared automatically
- Check-in timestamps are several hours old on fresh open

**Prevention:**
- On `AppState` change from background to active: always fetch recent data (last N messages per channel, latest task state, latest check-ins) as a REST/HTTP call before waiting for the live subscription to resume
- Treat the reconnection window as a cache-miss: fetch + subscribe, not just subscribe
- Persist last-seen message IDs locally so the catch-up query is bounded and fast

**Phase to address:** Core real-time messaging phase; revisit during location check-in phase

---

### Pitfall 4: Location Permission Denied Because It Was Asked at the Wrong Time

**What goes wrong:** The app asks for location permission at launch or during onboarding — before the user has touched the check-in feature. Users deny it. On iOS, once denied, the app cannot ask again; the user must manually go to Settings. The check-in feature is permanently broken for that user unless they know to fix it themselves.

**Why it happens:** Developers request all permissions upfront for convenience. Users have no context for why the app needs location during onboarding, and default to "Deny."

**Consequences:** A core feature (location check-ins) silently fails for any user who denied permission early. The feature appears broken. On iOS, this is unrecoverable without user action.

**Warning signs:**
- Location permission request appears before the user has navigated to the check-in screen
- No explanation is shown before the system permission dialog
- The app does not gracefully handle the denied state (crashes, shows blank screen, or silently fails)

**Prevention:**
- Request location permission only at the moment the user taps "Share My Location" for the first time — not earlier
- Show an in-app explanation screen ("This lets you share your current location with family — we never track you continuously") before triggering the system dialog
- Handle the denied state explicitly: show a "Location access needed" message with a button that opens Settings
- Use `expo-location` (or equivalent) which provides `requestForegroundPermissionsAsync` — call this only in the check-in flow, never at app start

**Phase to address:** Location check-in feature phase

---

## Moderate Pitfalls

---

### Pitfall 5: Message Ordering Breaks Under Normal Conditions

**What goes wrong:** Two family members post to the same channel within seconds of each other. On their respective devices the messages appear in sent order, but on a third device they arrive in a different order. Conversations become confusing.

**Why it happens:** Client-generated timestamps are unreliable (device clocks differ). Server-assigned sequence numbers are not used. Without a canonical ordering mechanism, simultaneous inserts produce non-deterministic sort order.

**Prevention:**
- Use server-assigned timestamps or monotonic sequence numbers for message ordering — never trust client-generated `Date.now()`
- Sort message lists by server timestamp descending/ascending consistently
- When using Supabase: use `created_at` with `DEFAULT now()` (server-side) not a client-provided timestamp field

**Phase to address:** Core messaging schema design

---

### Pitfall 6: Shared Task List Has Concurrent Edit Conflicts

**What goes wrong:** Two family members check off the same task at roughly the same time. One device shows it checked, another shows it unchecked. Or a task is deleted by one person while another is editing its title.

**Why it happens:** Optimistic UI updates local state immediately. If two clients modify the same row simultaneously without conflict resolution, the last-write-wins and one user's action is silently lost.

**Prevention:**
- Use database-level atomic updates (toggle via SQL `UPDATE ... SET done = NOT done` rather than read-then-write from client)
- For task lists, last-write-wins on `checked` state is acceptable — but communicate it clearly in UI (brief flash of the correct state)
- Avoid letting users edit a task title in a free-text field that auto-saves every keystroke; use an explicit "save" action to reduce concurrent write frequency

**Phase to address:** Shared task list feature phase

---

### Pitfall 7: Unread Message Count Becomes Permanently Wrong

**What goes wrong:** A family member reads all messages on their phone. The badge clears. They open the app on a second device — the badge still shows unread. Or the reverse: they read a channel on device A, but device B shows a persistent unread dot forever.

**Why it happens:** Unread state is stored per-device rather than per-user-per-channel on the server. Or the read cursor is updated optimistically but the server confirmation fails silently, leaving the two out of sync.

**Prevention:**
- Store read cursors server-side as `{user_id, channel_id, last_read_message_id}`
- Update the cursor on the server whenever a user opens a channel; do not rely solely on client-side tracking
- On app open, fetch fresh unread counts from the server rather than using cached values

**Phase to address:** Core messaging phase (design schema with read cursors from day one — retrofitting is painful)

---

### Pitfall 8: Cross-Platform UI Divergence Makes the App Feel Broken on One Platform

**What goes wrong:** The app is built and tested primarily on iOS. On Android, the keyboard behavior is different (overlaps the message input instead of pushing it up), date pickers look wrong, back-button navigation does not work as expected, and font rendering differs enough to break tight layouts.

**Why it happens:** React Native uses native components which behave differently on each OS. Android's `softwareKeyboard` mode vs. iOS's `KeyboardAvoidingView` have different defaults. Android has a hardware back button with no iOS equivalent.

**Prevention:**
- Test on real Android hardware (not just simulator) from the very first screen — do not defer Android testing to "near the end"
- Use `KeyboardAvoidingView` with `behavior="padding"` on iOS and `behavior="height"` on Android; test both
- Handle Android back button explicitly in navigation (React Navigation does this, but custom modals often miss it)
- Budget extra time for Android-specific fixes in every phase that introduces new UI

**Phase to address:** All UI phases; establish Android test discipline in the foundation phase

---

### Pitfall 9: Onboarding Failure Kills Adoption Within the Family

**What goes wrong:** The person who set up the app (typically the most tech-savvy family member) shares the family code. Less tech-savvy relatives open the app, see an unfamiliar interface, can't find where to enter the code, or don't understand what channels are. They give up within 3 minutes and never open the app again.

**Why it happens:** Builders optimize for their own mental model. Onboarding is designed for someone who already understands the app. 74% of users abandon apps that present friction at first launch; 80% abandon within the first three days.

**Prevention:**
- The family code entry screen must be the first thing a new user sees — not a feature tour, not permission requests, not profile setup
- After joining, show a brief "here's what this is" intro: channels for chatting, check-in to share your location, tasks for shared to-dos — one sentence each, skippable
- Test onboarding with a non-technical family member before launch; watch them go through it without guidance
- Keep the code format human-readable (avoid ambiguous characters: 0/O, 1/I/l)

**Phase to address:** Authentication and onboarding phase

---

## Minor Pitfalls

---

### Pitfall 10: No Offline Graceful Degradation

**What goes wrong:** The app requires an active connection to function. When a family member is in a basement or on a plane, the app shows a blank screen or spinner. They cannot read recent messages, see the task list, or review the last check-in.

**Prevention:**
- Cache the last N messages per channel locally using AsyncStorage / SQLite (expo-sqlite)
- Show cached data immediately on open; indicate "offline" state clearly with a banner rather than hiding content
- Queue outgoing messages locally and flush when connectivity returns

**Phase to address:** Post-MVP polish phase

---

### Pitfall 11: Channels Multiply Without Discipline

**What goes wrong:** Family members can create channels freely. Over time, trivial channels accumulate ("random 2", "grocery backup", "old grocery"). No one knows which channel to use. The structured communication benefit is lost.

**Prevention:**
- Limit channel creation to the family creator (admin) for v1
- Start with 3-4 default channels pre-created on family setup (General, Groceries, Planning, Random)
- Do not add channel archiving or deletion in v1 — keep the feature footprint small

**Phase to address:** Channel setup during family creation phase

---

### Pitfall 12: Location Check-In Accuracy Varies Wildly Without Communication

**What goes wrong:** A check-in shows "Home" when the family member is actually at a gas station two blocks away. GPS accuracy on mobile varies from 5m to 500m depending on device, signal, and whether the device just woke from sleep. Family members distrust the feature.

**Prevention:**
- Show accuracy radius alongside the check-in ("Within ~50m") so the family understands the limitation
- Do not reverse-geocode to a named place (e.g., "Costco") in v1 — it adds complexity and failure modes; show coordinates on a map instead
- Wait for a stable GPS fix (accuracy < 100m) before allowing the check-in to send; show a "Getting location..." spinner

**Phase to address:** Location check-in feature phase

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Family code + auth setup | Code brute force (Pitfall 2); bad onboarding (Pitfall 9) | Rate limit join endpoint; test with non-technical users |
| Channel messaging | Silent message loss (Pitfall 1); wrong ordering (Pitfall 5); stale foreground data (Pitfall 3) | Use managed real-time service; server timestamps; re-fetch on foreground |
| Read state / badges | Permanently wrong unread count (Pitfall 7) | Design read cursor schema before writing any UI |
| Location check-ins | Permission denied at wrong time (Pitfall 4); GPS accuracy trust (Pitfall 12) | Just-in-time permission; show accuracy radius |
| Shared task lists | Concurrent edit conflicts (Pitfall 6) | Atomic DB toggles; server-side state |
| Any UI phase | Android divergence (Pitfall 8) | Test on real Android hardware from day one |
| Post-MVP | Feature creep: push notifications, live tracking, DMs, web app | Stay anchored to PROJECT.md out-of-scope list |

---

## Sources

- [Realtime apps with React Native and WebSockets: client-side challenges — Ably](https://ably.com/topic/websockets-react-native)
- [Designing chat architecture for reliable message ordering at scale — Ably](https://ably.com/blog/chat-architecture-reliable-message-ordering)
- [Best Practices of using WebSockets in React Native Projects — Medium](https://medium.com/@tusharkumar27864/best-practices-of-using-websockets-real-time-communication-in-react-native-projects-89e749ba2e3f)
- [Firestore takes up to 90 seconds to get new data after app returns to foreground — Firebase Android SDK Issue #2637](https://github.com/firebase/firebase-android-sdk/issues/2637)
- [Enumeration Attacks: What They Are and How to Prevent Them — TechTarget](https://www.techtarget.com/searchsecurity/tip/What-enumeration-attacks-are-and-how-to-prevent-them)
- [OWASP Mobile Top 10 2024: A Security Guide — GetAstra](https://www.getastra.com/blog/mobile/owasp-mobile-top-10-2024-a-security-guide/)
- [3 Design Considerations for Effective Mobile-App Permission Requests — Nielsen Norman Group](https://www.nngroup.com/articles/permission-requests/)
- [Optimizing iOS location services: maximize your app's battery life — Rangle.io](https://rangle.io/blog/optimizing-ios-location-services)
- [iOS: Cannot request location always if we already have location when in use permission — react-native-permissions #490](https://github.com/zoontek/react-native-permissions/issues/490)
- [Onboarding That Works: Real App Flows and 5 Mistakes — Reteno](https://reteno.com/blog/won-in-60-seconds-how-top-apps-nail-onboarding-to-drive-subscriptions)
- [Flutter vs React Native in 2025: A Comprehensive Comparison — The Droids On Roids](https://www.thedroidsonroids.com/blog/flutter-vs-react-native-comparison)
- [expo-notifications background task not working — Expo GitHub Issues](https://github.com/expo/expo/issues/13767)
