---
phase: 02-messaging
plan: "05"
subsystem: messaging/reactions
tags: [reactions, emoji, signalr, realtime, ui-components]
dependency_graph:
  requires: ["02-03", "02-04"]
  provides: ["MSG-07", "reaction-toggle-api", "reaction-ui"]
  affects: ["message-thread-screen", "message-bubble"]
tech_stack:
  added: []
  patterns: ["emoji-allowlist-validation", "optimistic-reaction-toggle", "signalr-broadcast-fire-and-forget"]
key_files:
  created:
    - src/components/messages/ReactionPicker.tsx
    - src/components/messages/ReactionChips.tsx
  modified:
    - backend/src/routes/messages.ts
    - src/app/(tabs)/messages/[channelId].tsx
decisions:
  - "Emoji allowlist validated server-side against 6 unicode literals to prevent arbitrary emoji storage"
  - "Reaction toggle endpoint uses server-authoritative state — always fetches updated aggregates after add/remove"
  - "Optimistic local cache update on chip/picker tap for instant feedback; SignalR ReceiveReaction handles cross-device sync"
  - "broadcastReaction is fire-and-forget after SQL writes — broadcast failure does not block response"
metrics:
  duration: "2min"
  completed_date: "2026-04-05"
  tasks_completed: 2
  tasks_total: 3
  files_changed: 4
---

# Phase 02 Plan 05: Emoji Reactions Summary

**One-liner:** Emoji reactions end-to-end — server toggle endpoint with allowlist validation, ReactionPicker modal (6 emojis, long-press), ReactionChips display (count + accent border for own), real-time broadcast via SignalR.

## What Was Built

### Task 1: Reaction toggle API endpoint + reactions in message fetch (commit: 0efbd59)

Added two capabilities to `backend/src/routes/messages.ts`:

1. **POST /messages/:messageId/reactions** — toggles an emoji reaction for the authenticated user. Validates emoji against a 6-emoji allowlist, checks for existing reaction, inserts or deletes accordingly, fetches updated aggregates, gets the channel ID for SignalR broadcast, and returns `{ action, reactions }`.

2. **Reactions in GET /messages** — after fetching messages, dynamically queries `message_reactions` for all message IDs in the page using parameterized IN clause, groups results by messageId, and attaches a `reactions` array to each message before the response.

### Task 2: ReactionPicker + ReactionChips components + wire into message thread (commit: 5f31fc5)

**ReactionPicker** (`src/components/messages/ReactionPicker.tsx`):
- Modal with semi-transparent backdrop (tap-to-dismiss)
- 6-emoji row: thumbs-up, heart, laugh, surprised, sad, angry
- 44px touch targets, 24px emoji font, borderRadius 22px pill shape
- Exports `EMOJI_OPTIONS` array for reuse

**ReactionChips** (`src/components/messages/ReactionChips.tsx`):
- Renders reaction groups as chips: `{emoji} {count}`
- Own reaction chips use `colors.accent` border; others use `colors.border`
- 44px minHeight touch targets, `gap: Spacing.xs` flex-wrap row
- Returns null when reactions array is empty

**[channelId].tsx wiring:**
- `pickerMessageId` state tracks which message has picker open
- `handleToggleReaction` calls `toggleReaction` API, updates query cache optimistically, closes picker
- `renderItem` passes `onLongPress` to open picker and renders `<ReactionChips>` as children slot
- `<ReactionPicker>` rendered in JSX tree before closing `</KeyboardAvoidingView>`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All reaction data flows from real API calls. The `reactions: []` in the POST /messages broadcast payload (set in plan 02-04) is intentional — newly sent messages have no reactions yet.

## Checkpoint Status

Task 3 is a `checkpoint:human-verify` gate requiring human verification of the complete messaging feature end-to-end. Paused at this checkpoint awaiting human approval.

### Verification Steps for Human

1. Start backend: `cd backend && npm run dev`
2. Start app: `npx expo start` and open on simulator/device
3. Navigate to Messages tab — verify channel list shows #general
4. Tap plus icon — verify create channel modal appears with validation
5. Create a channel (e.g. "test-channel") — verify it appears in list
6. Tap into a channel — verify empty state shows "Start the conversation"
7. Type a message and tap send — verify it appears instantly (optimistic)
8. Open same channel on second device/simulator — verify message is visible
9. Send a message from second device — verify it appears on first device in real-time
10. Long-press a message — verify 6-emoji picker appears
11. Select a reaction — verify chip appears below message with count
12. Tap the chip — verify reaction toggles (added/removed)
13. Scroll up in a channel with many messages — verify older messages load
14. Verify sender names are grouped (same sender within 5 min = no repeated name)

Resume signal: type "approved" or describe issues to fix.

## Self-Check: PASSED

- [x] `src/components/messages/ReactionPicker.tsx` — created
- [x] `src/components/messages/ReactionChips.tsx` — created
- [x] `backend/src/routes/messages.ts` — contains `/:messageId/reactions`, `broadcastReaction`, `allowedEmojis`, `DELETE FROM message_reactions`, `INSERT INTO message_reactions`, `STRING_AGG`, `reactionsByMessage`
- [x] `src/app/(tabs)/messages/[channelId].tsx` — contains `ReactionPicker`, `ReactionChips`, `toggleReaction`, `pickerMessageId`, `onLongPress`
- [x] Task 1 commit `0efbd59` — verified in git log
- [x] Task 2 commit `5f31fc5` — verified in git log
