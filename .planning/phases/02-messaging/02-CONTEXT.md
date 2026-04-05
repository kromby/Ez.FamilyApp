# Phase 2: Messaging - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement channel-based messaging so family members can communicate in real time through named channels. This phase delivers: channel list with last-message previews, channel creation, real-time text messaging via Azure SignalR, message history persistence in Azure SQL, sender name/timestamp display, and emoji reactions. No media sharing, no push notifications, no DMs.

</domain>

<decisions>
## Implementation Decisions

### Channel List Design
- **D-01:** Channel list shows name + last message snippet + timestamp (iMessage/WhatsApp style preview)
- **D-02:** New channel creation via header button (plus icon in top-right nav bar) — opens name input modal
- **D-03:** Every family auto-gets a #general channel on creation — always exists, cannot be deleted
- **D-04:** Channels with unread messages show bold channel name (no counts — MSG-10 is v2)

### Message Display Style
- **D-05:** Flat list layout with sender name (Slack/Discord style) — no chat bubbles
- **D-06:** Timestamps inline with each message (small, next to or below)
- **D-07:** Sender name shown only on first message in a consecutive group from same sender
- **D-08:** Message input is text-only with send button — no emoji keyboard shortcut (media out of scope)

### Real-time & Persistence
- **D-09:** Send flow: persist to Azure SQL first, then broadcast via SignalR — reliability over speed
- **D-10:** Optimistic updates — message appears in sender's list immediately while API call happens in background; error indicator on failure
- **D-11:** Message history loading — Claude's discretion on batch size and loading pattern (infinite scroll up or load-more button)

### Emoji Reactions UX
- **D-12:** Long-press on message to trigger reaction picker (standard mobile pattern)
- **D-13:** Quick-pick row of 6 common emojis (no full keyboard) — e.g. thumbs up, heart, laugh, surprised, sad, angry
- **D-14:** Reactions display as emoji chips with count below the message — tap chip to toggle your own reaction

### Claude's Discretion
- Message history batch size and loading pattern (D-11)
- Exact quick-pick emoji set for reactions
- Channel name input validation rules (min/max length, allowed characters)
- Empty channel state (what shows when a channel has no messages yet)
- Message grouping timing threshold (how many minutes before showing sender name again)
- Error states for failed message sends
- SignalR connection management (reconnect behavior, connection status indicator)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `.planning/PROJECT.md` — Project vision, constraints (Azure backend), key decisions
- `.planning/REQUIREMENTS.md` — MSG-01 through MSG-07 acceptance criteria
- `.planning/research/STACK.md` — Stack recommendations (note: Supabase recommended but project uses Azure — adapt patterns)
- `.planning/research/ARCHITECTURE.md` — Component boundaries and data model (adapt for Azure)

### Phase 1 Foundation (build on these patterns)
- `src/stores/session.tsx` — Zustand store pattern with SecureStore persistence, User interface with id/displayName/familyId/familyName
- `src/constants/theme.ts` — Theme system (Colors light/dark, Spacing, Typography) — all new UI must use this
- `src/app/(tabs)/_layout.tsx` — Tab layout with Ionicons pattern
- `src/app/(tabs)/messages.tsx` — Current placeholder to be replaced
- `backend/src/db/schema.sql` — Existing schema (families, users tables) — extend with channels/messages
- `backend/src/db/connection.ts` — Azure SQL connection pattern (mssql)
- `backend/src/routes/` — Existing Express route pattern (auth.ts, families.ts, users.ts)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Zustand store** (`src/stores/session.tsx`): Pattern for creating stores with SecureStore persistence — use for message/channel state
- **Theme system** (`src/constants/theme.ts`): Colors (light/dark), Spacing, Typography — all messaging UI must follow this
- **Tab layout** (`src/app/(tabs)/_layout.tsx`): Ionicons icon pattern for tab bar
- **QueryClientProvider**: Already at root layout — TanStack Query ready for server state
- **Express routes**: Pattern in `backend/src/routes/` for authenticated API endpoints

### Established Patterns
- **State management**: Zustand for client state, TanStack Query available for server state
- **Styling**: React Native StyleSheet with theme constants (no NativeWind yet)
- **Auth**: JWT tokens via `auth_token` in SecureStore, User object with familyId
- **Backend**: Express + mssql on Azure SQL, route files in `backend/src/routes/`

### Integration Points
- `src/app/(tabs)/messages.tsx` — Replace placeholder with channel list screen
- `backend/src/db/schema.sql` — Add channels and messages tables
- `backend/src/routes/` — Add channels.ts and messages.ts route files
- Azure SignalR — New service integration for real-time messaging

</code_context>

<specifics>
## Specific Ideas

- Flat list style (not bubbles) — user wants Slack/Discord feel, not iMessage
- #general channel auto-created — ensures every family has somewhere to chat immediately
- Bold channel names for unread — lightweight unread indication without full badge system
- 6-emoji quick-pick for reactions — keep it simple, no full keyboard needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-messaging*
*Context gathered: 2026-04-05*
