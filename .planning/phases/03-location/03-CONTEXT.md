# Phase 3: Location - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Passive location capture on message send and last-known-location display per family member. When a user sends a message, their GPS coordinates are silently captured and stored. The Location tab shows all family members with their most recent location — tapping a member expands an inline map with address and time ago. No live tracking, no background location, no geofencing.

</domain>

<decisions>
## Implementation Decisions

### Location Display
- **D-01:** Location tab shows a list of all family members with their last known location summary (address snippet + relative time)
- **D-02:** Members without location data still appear in the list with "No location yet" placeholder
- **D-03:** Tapping a member expands an inline map card (not a modal or new screen) showing a pin, reverse-geocoded address, and time ago
- **D-04:** Map uses react-native-maps (Apple Maps on iOS, Google Maps on Android)
- **D-05:** Stale location indication — Claude's discretion (relative time + optional visual fading)

### Permission Flow
- **D-06:** Pre-permission prompt is a centered modal with a friendly icon explaining: "Your family can see where you last were when you send a message" — with Allow / Not now buttons
- **D-07:** Permission prompt appears proactively on first app open (not on first message send) — ensures everyone is asked early
- **D-08:** If user denies: messages send normally without location (silent fallback), no nagging or reminders in the messaging flow
- **D-09:** Location tab shows a warning banner when location sharing is off for the current user, with a link to enable in settings

### Capture Behavior
- **D-10:** Location is captured silently when sending a message — no extra user step required
- **D-11:** Messages with location data show a subtle pin icon in the message thread UI (tappable to see where it was sent from)
- **D-12:** Full GPS precision stored — exact coordinates from expo-location, reverse-geocoded to address for display
- **D-13:** Database schema design — Claude's discretion (columns on messages table vs separate locations table)

### Privacy Controls
- **D-14:** Profile screen gets a "Share location" toggle — when off, messages send without location, other members see "Location sharing off"
- **D-15:** Location data retained indefinitely — the Location tab always shows the most recent location per member

### Claude's Discretion
- Database schema approach (D-13) — columns on messages table or separate locations table
- Stale location visual treatment (D-05) — fading, color changes, or time-only
- Reverse geocoding strategy — client-side vs server-side, caching approach
- Location pin icon design in message thread
- Map card height and animation when expanding inline
- "No location yet" placeholder styling
- Error handling for GPS failures (timeout, no signal)
- Family members list API endpoint design (needed for Location tab — doesn't exist yet)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Project vision, constraints (Azure backend, no BaaS), key decisions (passive location model)
- `.planning/REQUIREMENTS.md` — LOC-01 through LOC-04 acceptance criteria

### Phase 1 Foundation (existing patterns)
- `src/stores/session.tsx` — Zustand store with SecureStore persistence, User interface (id/displayName/familyId/familyName)
- `src/constants/theme.ts` — Theme system (Colors light/dark, Spacing, Typography) — all new UI must use this
- `src/app/(tabs)/_layout.tsx` — Tab layout with Ionicons pattern
- `src/app/(tabs)/location.tsx` — Current placeholder screen to be replaced
- `src/app/(tabs)/profile.tsx` — Profile screen where location toggle will be added

### Phase 2 Messaging (integration points)
- `backend/src/routes/messages.ts` — POST /messages endpoint — must be extended to accept/store location coordinates
- `backend/src/db/schema.sql` — Current schema (messages table) — needs location columns or new table
- `src/lib/api.ts` — sendMessage function — must be updated to include location payload
- `src/app/(tabs)/messages/[channelId].tsx` — Message thread screen — location pin indicator integration point
- `src/components/messages/MessageBubble.tsx` — Message rendering — pin icon integration point
- `src/hooks/useSignalR.ts` — SignalR hook — broadcast payload may need location data

No external specs — requirements fully captured in decisions above and in `.planning/REQUIREMENTS.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Theme system** (`src/constants/theme.ts`): Colors, Spacing, Typography — all location UI must follow this
- **Zustand store** (`src/stores/session.tsx`): Pattern for client state — use for location permission state
- **API client** (`src/lib/api.ts`): `apiFetch` helper with auth header injection — use for location endpoints
- **FlashList** (`@shopify/flash-list`): Already installed — use for member list if needed
- **MessageBubble** (`src/components/messages/MessageBubble.tsx`): Existing message renderer — add pin icon here

### Established Patterns
- **State management**: Zustand for client state, TanStack Query for server state
- **Styling**: React Native StyleSheet with theme constants (no NativeWind)
- **Auth**: JWT tokens via `auth_token` in SecureStore
- **Backend**: Express + mssql on Azure SQL, route files in `backend/src/routes/`
- **Real-time**: Azure SignalR for broadcast, persist-first pattern (D-09 from Phase 2)

### Integration Points
- `src/app/(tabs)/location.tsx` — Replace placeholder with member list + inline map expansion
- `src/app/(tabs)/profile.tsx` — Add "Share location" toggle
- `backend/src/routes/messages.ts` — Extend POST /messages to accept lat/lng
- `backend/src/db/schema.sql` — Add location storage
- `src/lib/api.ts` — Update sendMessage to include coordinates
- `src/components/messages/MessageBubble.tsx` — Add subtle location pin icon
- New: `backend/src/routes/` — Family members endpoint (GET members with last location)
- New: `src/hooks/` — useLocationPermission hook for permission flow

</code_context>

<specifics>
## Specific Ideas

- Permission prompt on first app open, not on first message — get it out of the way early
- Silent fallback on denial — never nag about location in the messaging flow, but show a banner on the Location tab
- Location pin on messages is subtle — doesn't disrupt the flat-list Slack-style design from Phase 2
- Inline map expansion keeps users on the Location tab — no navigation away
- All family members always visible in the list, even without location data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-location*
*Context gathered: 2026-04-06*
