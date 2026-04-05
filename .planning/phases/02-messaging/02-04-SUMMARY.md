---
phase: 02-messaging
plan: 04
subsystem: messaging-ui
tags: [signalr, real-time, messaging, zustand, tanstack-query, flashlist]
dependency_graph:
  requires: [02-01, 02-02, 02-03]
  provides: [message-thread-screen, signalr-hook, messaging-store]
  affects: [02-05]
tech_stack:
  added: []
  patterns:
    - SignalR HubConnection lifecycle with automatic reconnect and foreground reconnect
    - Optimistic send with temp ID dedup on ReceiveMessage
    - TanStack Query cache direct update from SignalR events (no polling)
    - FlashList inverted for newest-at-bottom message rendering
    - Sender grouping with 5-minute threshold across inverted list
key_files:
  created:
    - src/hooks/useSignalR.ts
    - src/stores/messaging.ts
    - src/components/messages/MessageBubble.tsx
    - src/components/messages/MessageInput.tsx
    - src/app/(tabs)/messages/[channelId].tsx
  modified: []
decisions:
  - useSignalR is called inside the thread screen — one connection per session is managed via useEffect token dependency
  - Optimistic message marked error (not rolled back) on mutation failure so user sees the failed message
  - FlashList inverted means index+1 is visually above — grouping logic uses index+1 as "previous" for correct sender grouping
  - Connection status banner shows for both disconnected and reconnecting states
metrics:
  duration: "4min"
  completed_date: "2026-04-05"
  tasks_completed: 2
  files_created: 5
---

# Phase 02 Plan 04: Message Thread Screen Summary

Real-time message thread screen with SignalR integration, optimistic sends, cursor-paginated history, and sender grouping.

## What Was Built

### Task 1: SignalR hook + messaging Zustand store (commit ae3cad5)

**src/stores/messaging.ts** — Zustand store with `connectionStatus` union type (`disconnected | connecting | connected | reconnecting`) and `setConnectionStatus` action.

**src/hooks/useSignalR.ts** — Full SignalR HubConnection lifecycle:
- Negotiates via `POST /signalr/negotiate` to get hub URL + access token
- Connects with `withAutomaticReconnect([0, 2000, 5000, 10000, 30000])`
- Registers `ReceiveMessage` and `ReceiveReaction` handlers that update TanStack Query cache directly
- `ReceiveMessage` deduplicates with optimistic temp messages by matching `senderId + text`
- `onreconnected` re-joins channel groups via `POST /signalr/join-channels`
- `AppState.addEventListener` reconnects when app returns to foreground from disconnected state
- Cleans up connection and AppState listener on unmount

### Task 2: Message thread screen + MessageBubble + MessageInput (commit 6998d39)

**src/components/messages/MessageBubble.tsx** — Flat message row per UI-SPEC D-05/D-06/D-07:
- `isFirstInGroup=true`: renders sender name (700 weight) + timestamp on one line, message text below
- `isFirstInGroup=false`: message text only with `Spacing.xs` top margin
- `status=error`: 8px red dot left of message text with accessibilityLabel
- `children` slot for reaction chips (Plan 05)

**src/components/messages/MessageInput.tsx** — 52px input row:
- TextInput with `returnKeyType="send"` and `onSubmitEditing` for keyboard send
- Ionicons `send` icon button, accent color when active, textSecondary when disabled
- 44px touch target with `hitSlop={8}` and `accessibilityLabel`

**src/app/(tabs)/messages/[channelId].tsx** — Message thread screen:
- `useInfiniteQuery` with cursor pagination (30/page), `getNextPageParam` from `nextCursor`
- FlashList `inverted` with `onEndReached` triggering `fetchNextPage` for older messages
- Sender grouping: `getIsFirstInGroup` checks `index+1` (visually above in inverted list) for same sender within 5-min threshold
- Optimistic send: temp message with `id: temp-${Date.now()}` inserted into first page, replaced/confirmed by `ReceiveMessage` event
- `onError`: marks temp messages as `status: 'error'` instead of rollback
- Connection status banner when `disconnected | reconnecting`
- Empty state: "Start the conversation" with chatbubble-outline icon
- `KeyboardAvoidingView`: `padding` on iOS, `height` on Android

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired through real API calls and SignalR events. The reaction chips `children` slot in MessageBubble is intentionally empty pending Plan 05.

## Self-Check: PASSED
