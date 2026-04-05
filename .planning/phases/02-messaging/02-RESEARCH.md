# Phase 02: Messaging - Research

**Researched:** 2026-04-05
**Domain:** Azure SignalR Service + Express.js + React Native (@microsoft/signalr) + Azure SQL messaging
**Confidence:** HIGH (core stack verified against official Microsoft docs and npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Channel list shows name + last message snippet + timestamp (iMessage/WhatsApp style preview)
- **D-02:** New channel creation via header button (plus icon in top-right nav bar) — opens name input modal
- **D-03:** Every family auto-gets a #general channel on creation — always exists, cannot be deleted
- **D-04:** Channels with unread messages show bold channel name (no counts — MSG-10 is v2)
- **D-05:** Flat list layout with sender name (Slack/Discord style) — no chat bubbles
- **D-06:** Timestamps inline with each message (small, next to or below)
- **D-07:** Sender name shown only on first message in a consecutive group from same sender
- **D-08:** Message input is text-only with send button — no emoji keyboard shortcut (media out of scope)
- **D-09:** Send flow: persist to Azure SQL first, then broadcast via SignalR — reliability over speed
- **D-10:** Optimistic updates — message appears in sender's list immediately while API call happens in background; error indicator on failure
- **D-11:** Message history loading — Claude's discretion on batch size and loading pattern (infinite scroll up or load-more button)
- **D-12:** Long-press on message to trigger reaction picker (standard mobile pattern)
- **D-13:** Quick-pick row of 6 common emojis (no full keyboard)
- **D-14:** Reactions display as emoji chips with count below the message — tap chip to toggle your own reaction

### Claude's Discretion
- Message history batch size and loading pattern (D-11)
- Exact quick-pick emoji set for reactions
- Channel name input validation rules (min/max length, allowed characters)
- Empty channel state (what shows when a channel has no messages yet)
- Message grouping timing threshold (how many minutes before showing sender name again)
- Error states for failed message sends
- SignalR connection management (reconnect behavior, connection status indicator)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. v2 items: MSG-08 (seen/delivered), MSG-09 (offline queue), MSG-10 (unread badge counts).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MSG-01 | User can view a list of channels in their family | GET /channels route + ChannelList component replacing messages.tsx placeholder |
| MSG-02 | User can create a new channel with a name | POST /channels route + modal UI + auto-#general on family creation |
| MSG-03 | User can send a text message in a channel | POST /messages route (persist first) + SignalR broadcast + optimistic update |
| MSG-04 | User can see messages from other family members in real-time | @microsoft/signalr HubConnection on client + SignalR group broadcast on server |
| MSG-05 | Message history persists and loads when opening a channel | GET /messages?channelId cursor pagination from Azure SQL |
| MSG-06 | Messages display sender name and timestamp | messages JOIN users query; grouped display (D-07 sender grouping) |
| MSG-07 | User can react to a message with an emoji | message_reactions table + POST /reactions + SignalR broadcast + toggle logic |
</phase_requirements>

---

## Summary

This phase builds channel-based messaging on top of the existing Phase 1 Azure-native backend (Express + Azure SQL + mssql). The real-time layer uses **Azure SignalR Service in Default mode** with the Express backend acting as the app server. The backend exposes a `/negotiate` endpoint that generates a redirect response (SignalR URL + access token) so the React Native client can connect directly to Azure SignalR Service. The client uses `@microsoft/signalr` v10.0.0 (the current stable package). For message lists, `@shopify/flash-list` v2.3.1 replaces FlatList. TanStack Query (already installed) handles server state with optimistic updates.

The critical architectural decision is how to broadcast after persisting: the Express route saves to Azure SQL, then calls the Azure SignalR REST API (`POST /api/v1/hubs/{hub}/groups/{group}`) to push the message to all channel members. Group membership in SignalR is ephemeral — it must be re-established on each client connection. The recommended pattern is: client connects, then immediately calls `PUT /api/v1/hubs/{hub}/groups/{channelId}/users/{userId}` server-side (triggered by a POST from the client after connection is established). For a 5-10 person family app, the group approach is straightforward and scalable.

Navigation requires converting the current flat `messages.tsx` tab into a nested Stack inside the Messages tab, using Expo Router's file-based pattern: `src/app/(tabs)/messages/_layout.tsx` (Stack) + `src/app/(tabs)/messages/index.tsx` (channel list) + `src/app/(tabs)/messages/[channelId].tsx` (message thread).

**Primary recommendation:** Use Azure SignalR Default mode (not Serverless) with the Express backend as the app server. Implement the negotiate endpoint manually using the connection string JWT pattern, add user to SignalR groups via REST API after client connects, and broadcast new messages via REST API after SQL insert.

---

## Standard Stack

### Core (new additions for this phase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @microsoft/signalr | 10.0.0 | React Native SignalR client | Official Microsoft package; works in React Native; supports WebSocket transport; `withAutomaticReconnect()` built in |
| @shopify/flash-list | 2.3.1 | Performant message list rendering | Required by CLAUDE.md; significantly faster than FlatList for 100+ messages; mandatory for chat UIs |
| jsonwebtoken | 9.0.3 (already installed) | Sign JWT for SignalR negotiate endpoint | Already in backend; same library used for app auth JWTs |
| axios | — | HTTP calls to Azure SignalR REST API from backend | Or use Node.js built-in `fetch` (Node 18+); no new dep needed if using fetch |

### Already Installed (used for this phase)
| Library | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | 5.96.2 | Server state: channel list, message history, reactions |
| zustand | 5.0.12 | Client state: active channel, SignalR connection instance |
| mssql | 12.2.1 | Azure SQL queries for channels, messages, reactions |
| react-native-gesture-handler | 2.30.0 | Long-press gesture for reaction picker |
| react-native-reanimated | 4.2.1 | Animated reaction picker appearance |
| expo-router | 55.0.10 | File-based navigation: nested Stack inside Messages tab |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @microsoft/signalr | socket.io-client | socket.io requires a socket.io server; SignalR is already the Azure-native choice |
| @microsoft/signalr | @azure/signalr (Management SDK) | Management SDK is server-side only (.NET); Node.js client MUST use @microsoft/signalr |
| REST API broadcast | Azure Functions bindings | Functions add infrastructure complexity; Express is simpler for this project |
| FlashList | FlatList | FlatList lags with 100+ messages; FlatList is explicitly called out in CLAUDE.md as insufficient |

**Installation (backend — no new deps needed if using Node fetch):**
```bash
# If using axios for SignalR REST API calls from Express:
# (optional — Node 18+ has built-in fetch)
cd backend && npm install axios
```

**Installation (frontend):**
```bash
npx expo install @shopify/flash-list
npm install @microsoft/signalr
```

**Version verification:** Verified 2026-04-05 via `npm view`:
- `@microsoft/signalr`: 10.0.0 (published 10.0.0)
- `@shopify/flash-list`: 2.3.1 (published 2.3.1)
- `@tanstack/react-query`: 5.96.2 (already in package.json as ^5.96.2)

---

## Architecture Patterns

### Recommended Project Structure

**Backend additions:**
```
backend/src/
├── db/
│   └── schema.sql              # ADD: channels, messages, message_reactions tables
├── routes/
│   ├── auth.ts                 # (existing)
│   ├── families.ts             # (existing — extend to auto-create #general)
│   ├── channels.ts             # NEW: GET/POST /channels
│   ├── messages.ts             # NEW: GET/POST /messages, reactions
│   └── signalr.ts              # NEW: POST /signalr/negotiate, POST /signalr/join-channel
└── lib/
    └── signalr.ts              # NEW: helper to call SignalR REST API (broadcast, add user to group)
```

**Frontend additions:**
```
src/
├── app/(tabs)/
│   └── messages/               # CONVERT from messages.tsx to directory
│       ├── _layout.tsx         # Stack navigator
│       ├── index.tsx           # Channel list (replaces messages.tsx placeholder)
│       └── [channelId].tsx     # Message thread screen
├── components/
│   └── messages/
│       ├── ChannelListItem.tsx  # Channel row with name + last message preview
│       ├── MessageBubble.tsx    # Flat message row (sender name, text, timestamp)
│       ├── ReactionPicker.tsx   # 6-emoji quick-pick row
│       └── MessageInput.tsx    # Text input + send button
├── hooks/
│   └── useSignalR.ts           # SignalR connection lifecycle hook
└── stores/
    └── messaging.ts            # Zustand: active channelId, connection status
```

### Pattern 1: Azure SignalR Negotiate Flow (Default Mode)

**What:** Express backend exposes `POST /signalr/negotiate`. Client calls this first, receives `{ url, accessToken }`, then `@microsoft/signalr` uses those to connect directly to Azure SignalR Service.

**When to use:** Default mode — the Express server handles hub logic; SignalR Service is the transport proxy.

**Backend negotiate endpoint:**
```typescript
// Source: https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-concept-client-negotiation
import jwt from 'jsonwebtoken';

// Parse from env: AZURE_SIGNALR_CONNECTION_STRING
// Format: Endpoint=https://<name>.service.signalr.net;AccessKey=<key>;Version=1.0;
const endpoint = process.env.AZURE_SIGNALR_ENDPOINT!; // e.g. https://myhub.service.signalr.net
const accessKey = process.env.AZURE_SIGNALR_ACCESS_KEY!;
const hub = 'familyhub';

// POST /signalr/negotiate  (authenticated — requires JWT from app auth)
signalrRouter.post('/negotiate', authenticate, (req: AuthRequest, res) => {
  const url = `${endpoint}/client/?hub=${hub}`;
  const token = jwt.sign(
    { aud: url, nameid: req.userId },  // nameid = SignalR userId claim
    accessKey,
    { expiresIn: 3600 }
  );
  res.json({ url, accessToken: token });
});
```

**React Native client connection:**
```typescript
// Source: @microsoft/signalr npm package docs
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';

async function createConnection(token: string): Promise<HubConnection> {
  const connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/signalr/negotiate`, {
      // withUrl here points to YOUR negotiate endpoint, not SignalR Service
      // The client will call negotiate, get redirected, then connect to SignalR
      accessTokenFactory: () => token,  // app JWT for your negotiate endpoint
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  await connection.start();
  return connection;
}
```

**IMPORTANT CORRECTION:** `withUrl` in `@microsoft/signalr` on the client should point to your HUB URL, not the negotiate endpoint. The negotiate request is automatically sent to `<hubUrl>/negotiate`. So the client should be:

```typescript
// The client auto-appends /negotiate to the hub URL
const connection = new HubConnectionBuilder()
  .withUrl(`${API_BASE_URL}/signalr`, {
    accessTokenFactory: () => appJwtToken,
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
  .build();
```

This means the backend negotiate endpoint must be at `POST /signalr/negotiate`.

### Pattern 2: SignalR Group Management for Channels

**What:** Each channel maps to a SignalR group named by channelId UUID. When a user connects and opens a channel, the backend adds that user to the group via the SignalR REST API. When a message is sent, the backend broadcasts to the group.

**Critical fact:** Group membership in Azure SignalR is ephemeral (per-connection, not persisted). Every time the user reconnects, they must re-join the groups for their channels. The recommended approach for a small family app: when the user connects, the backend auto-adds them to ALL their family's channels (since they can see all channels).

**Backend group management helper:**
```typescript
// Source: https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-quickstart-rest-api
import jwt from 'jsonwebtoken';

const endpoint = process.env.AZURE_SIGNALR_ENDPOINT!;
const accessKey = process.env.AZURE_SIGNALR_ACCESS_KEY!;
const hub = 'familyhub';

function generateSignalRJwt(targetUrl: string): string {
  return jwt.sign({ aud: targetUrl }, accessKey, { expiresIn: 60 });
}

// Add user to a SignalR group (= channel)
async function addUserToGroup(userId: string, groupName: string): Promise<void> {
  const url = `${endpoint}/api/v1/hubs/${hub}/groups/${groupName}/users/${userId}`;
  const token = generateSignalRJwt(url);
  await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Broadcast message to channel group
async function broadcastToChannel(channelId: string, payload: object): Promise<void> {
  const url = `${endpoint}/api/v1/hubs/${hub}/groups/${channelId}`;
  const token = generateSignalRJwt(url);
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: 'ReceiveMessage',
      arguments: [payload],
    }),
  });
}
```

### Pattern 3: Message Send Flow (Persist-First)

**What:** Client persists optimistically, server saves to SQL, then broadcasts via SignalR REST API.

```
Client                  Backend (Express)         Azure SignalR Service
  |                          |                           |
  |--POST /messages--------->|                           |
  |  (text, channelId)       |--INSERT messages--------->|
  |                          |  (Azure SQL)              |
  |                          |--POST /api/v1/hubs/...-->|
  |                          |  (broadcast to group)     |--ReceiveMessage-->other clients
  |<--201 {message}---------|                           |
```

### Pattern 4: Expo Router Navigation for Messages Tab

**What:** Convert `messages.tsx` single file into a directory with nested Stack.

```
src/app/(tabs)/messages/
├── _layout.tsx           # <Stack>
├── index.tsx             # Channel list (was messages.tsx placeholder)
└── [channelId].tsx       # Message thread
```

**_layout.tsx:**
```typescript
// Source: https://docs.expo.dev/router/basics/common-navigation-patterns/
import { Stack } from 'expo-router';
export default function MessagesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Messages' }} />
      <Stack.Screen name="[channelId]" options={{ headerBackTitle: 'Channels' }} />
    </Stack>
  );
}
```

**CRITICAL:** The tab layout `_layout.tsx` currently references `name="messages"` for the Messages tab. When `messages.tsx` becomes `messages/index.tsx`, this reference remains `name="messages"` — Expo Router resolves directory indexes automatically. No change needed in the tab layout.

### Pattern 5: TanStack Query Optimistic Updates for Messages

```typescript
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
const sendMessage = useMutation({
  mutationFn: (text: string) => api.sendMessage(channelId, text),

  onMutate: async (text) => {
    await queryClient.cancelQueries({ queryKey: ['messages', channelId] });
    const previousMessages = queryClient.getQueryData(['messages', channelId]);

    // Optimistic message with temp ID
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      channelId,
      text,
      senderId: user.id,
      senderName: user.displayName,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    queryClient.setQueryData(['messages', channelId], (old: MessagesPage[]) =>
      appendMessageToPages(old, optimisticMessage)
    );
    return { previousMessages };
  },

  onError: (_err, _text, context) => {
    queryClient.setQueryData(['messages', channelId], context?.previousMessages);
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
  },
});
```

### Pattern 6: Cursor-Based Pagination for Message History

**What:** Use keyset pagination (cursor = last message's `created_at` + `id`). More performant than OFFSET for large chat histories.

**SQL query (Azure SQL / MSSQL):**
```sql
-- Fetch 30 messages before a cursor (loading older messages)
SELECT TOP 30
  m.id, m.channel_id, m.text, m.created_at,
  u.display_name AS sender_name, u.id AS sender_id
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.channel_id = @channelId
  AND m.created_at < @cursorTime   -- cursor from last loaded batch
ORDER BY m.created_at DESC, m.id DESC;
```

**Recommendation (Claude's discretion on D-11):** Batch size of 30 messages. Infinite scroll upward (load more when user scrolls to top). Cursor is the `created_at` timestamp of the oldest visible message. This is standard for chat apps and avoids OFFSET performance issues.

### Anti-Patterns to Avoid

- **Sending to `SkipNegotiation: true` on the client:** Azure SignalR requires negotiation because the client needs the service URL and access token. Never skip negotiation with Azure SignalR Service.
- **Storing SignalR group membership in your database:** Group membership is ephemeral in Azure SignalR. Store which channels a family has in SQL; let SignalR handle connection groups transiently.
- **Polling for new messages:** SignalR replaces polling. Do not use `refetchInterval` for real-time message updates — use the SignalR `ReceiveMessage` listener to update the query cache directly.
- **Using OFFSET pagination for messages:** For chat history with 100+ messages, OFFSET scans all skipped rows. Use keyset pagination with `WHERE created_at < @cursor`.
- **FlatList for message rendering:** CLAUDE.md explicitly requires FlashList for message lists. FlatList lags with 100+ messages.
- **Rebuilding the SignalR connection on every screen mount:** Create one connection per session, stored in Zustand, not recreated per screen.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket connection management | Custom WebSocket client with reconnect logic | `@microsoft/signalr` with `withAutomaticReconnect()` | SignalR handles WebSocket fallbacks, exponential backoff, heartbeat, and Azure SignalR protocol negotiation |
| Message list virtualization | Custom virtual scroll | `@shopify/flash-list` | FlashList uses recycled cells; custom virtualization will miss edge cases (dynamic row heights, scroll-to-bottom) |
| Optimistic update state machine | Custom pending/error/success state | TanStack Query `useMutation` `onMutate`/`onError`/`onSettled` | Already installed; handles cache rollback on error |
| Long-press gesture | `onLongPress` prop + manual timer | `react-native-gesture-handler` `LongPressGestureHandler` | Already installed; handles cross-platform gesture cancellation and haptic coordination |
| JWT generation for SignalR REST API | Custom HMAC-SHA256 implementation | `jsonwebtoken` (already in backend) | Same library used for app auth; same HS256 algorithm required by SignalR REST API |

**Key insight:** Azure SignalR group membership is inherently transient; trying to build your own presence/membership tracking on top will create consistency bugs. Trust the SignalR group model: re-add users to their channel groups on each reconnect.

---

## Common Pitfalls

### Pitfall 1: SignalR Connection Lost When App Goes to Background
**What goes wrong:** iOS/Android suspend WebSocket connections when the app is backgrounded. `withAutomaticReconnect()` alone won't re-establish immediately on foreground return.
**Why it happens:** Mobile OS kills background network activity after 30 seconds to several minutes.
**How to avoid:** Use React Native `AppState` to detect `active` state transitions. On `AppState` change to `active`, check `connection.state === HubConnectionState.Disconnected` and call `connection.start()` manually.
**Warning signs:** Messages received while app is backgrounded don't appear until user pulls-to-refresh.

```typescript
// Reconnect on foreground
useEffect(() => {
  const subscription = AppState.addEventListener('change', async (nextState) => {
    if (nextState === 'active' && connection.state === HubConnectionState.Disconnected) {
      await connection.start();
      // Re-join channel groups
    }
  });
  return () => subscription.remove();
}, [connection]);
```

### Pitfall 2: Ephemeral Group Membership — Missing Messages After Reconnect
**What goes wrong:** User reconnects (network switch, background/foreground), but isn't re-added to their channel groups. Subsequent messages are not delivered.
**Why it happens:** Azure SignalR groups are per-connection. Reconnection creates a new connectionId.
**How to avoid:** After every `connection.start()` (including reconnects), call the backend endpoint that adds the user to all their channel groups. Implement `connection.onreconnected()` handler.

```typescript
connection.onreconnected(async () => {
  await api.post('/signalr/rejoin-channels');  // backend re-adds user to all family channel groups
});
```

### Pitfall 3: Optimistic Message Appearing Twice (Duplicate on Server Confirmation)
**What goes wrong:** Optimistic message shows with temp ID. SignalR broadcasts the real message. Query invalidation fetches from server. The real message appears alongside the optimistic one.
**Why it happens:** The optimistic message has a temp ID that doesn't match the server-assigned ID. Invalidation fetches from server, and both coexist.
**How to avoid:** When the server message arrives via SignalR `ReceiveMessage`, update the query cache by replacing the temp ID message. On `onSettled`, invalidate to get canonical state.

### Pitfall 4: Channel Creation Race — #general Already Exists
**What goes wrong:** Family creation triggers `#general` auto-creation but the user also creates a channel immediately, causing a race.
**Why it happens:** `#general` creation is synchronous within the `POST /families` handler — this is safe. The race only occurs if creation is async.
**How to avoid:** Create `#general` inside the same database transaction as family creation. Single INSERT statement, no async delay.

### Pitfall 5: Reaction Toggle Logic Edge Cases
**What goes wrong:** User taps their own reaction to remove it; a race condition allows double-remove.
**Why it happens:** Multiple rapid taps trigger multiple DELETE requests.
**How to avoid:** Use UPSERT pattern in SQL for reactions. `MERGE` statement to add; check existence before DELETE. Return current state (added/removed) from the API to update UI authoritatively.

### Pitfall 6: FlashList `estimatedItemSize` Misconfiguration
**What goes wrong:** FlashList jumps or flickers when scrolling.
**Why it happens:** `estimatedItemSize` is too far from actual rendered size.
**How to avoid:** Measure a representative message row height (approximately 60px for a single-line message, 80px average accounting for multi-line). Set `estimatedItemSize={80}`. For grouped messages (no repeated sender name), it can be ~50px.

---

## Code Examples

### Database Schema Extensions

```sql
-- Source: Based on existing schema.sql pattern (UNIQUEIDENTIFIER, DATETIME2, NVARCHAR)

CREATE TABLE channels (
  id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  family_id     UNIQUEIDENTIFIER NOT NULL REFERENCES families(id),
  name          NVARCHAR(50) NOT NULL,
  created_by    UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  created_at    DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  -- last_message_at for sorting channel list efficiently
  last_message_at DATETIME2 NULL,
  last_message_text NVARCHAR(200) NULL,
  CONSTRAINT uq_channel_name_per_family UNIQUE (family_id, name)
);

CREATE TABLE messages (
  id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  channel_id  UNIQUEIDENTIFIER NOT NULL REFERENCES channels(id),
  sender_id   UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  text        NVARCHAR(MAX) NOT NULL,
  created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  INDEX ix_messages_channel_created (channel_id, created_at DESC)
);

CREATE TABLE message_reactions (
  id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  message_id  UNIQUEIDENTIFIER NOT NULL REFERENCES messages(id),
  user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  emoji       NVARCHAR(10) NOT NULL,
  created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  CONSTRAINT uq_reaction_per_user_message UNIQUE (message_id, user_id, emoji)
);
```

**Design note:** `last_message_at` + `last_message_text` are denormalized onto `channels` for O(1) channel list queries. Update via trigger or in the `POST /messages` handler after INSERT.

### Express Routes Pattern

```typescript
// backend/src/routes/channels.ts — follows existing families.ts pattern
import { Router } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { addUserToSignalRGroups } from '../lib/signalr';

export const channelsRouter = Router();

// GET /channels — list family channels
channelsRouter.get('/', authenticate, async (req: AuthRequest, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('familyId', sql.UniqueIdentifier, req.familyId)
    .query(`
      SELECT id, name, last_message_at, last_message_text
      FROM channels
      WHERE family_id = @familyId
      ORDER BY COALESCE(last_message_at, created_at) DESC
    `);
  res.json(result.recordset);
});

// POST /channels — create a channel
channelsRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  const { name } = req.body;
  // Validate: 1-30 chars, alphanumeric + spaces + hyphens
  if (!name || name.length < 1 || name.length > 30) {
    return res.status(400).json({ error: 'Channel name must be 1-30 characters' });
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('familyId', sql.UniqueIdentifier, req.familyId)
    .input('name', sql.NVarChar, name.trim())
    .input('createdBy', sql.UniqueIdentifier, req.userId)
    .query(`
      INSERT INTO channels (family_id, name, created_by)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.created_at
      VALUES (@familyId, @name, @createdBy)
    `);
  res.status(201).json(result.recordset[0]);
});
```

### useSignalR Hook Skeleton

```typescript
// src/hooks/useSignalR.ts
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../stores/session';
import { API_BASE_URL } from '../constants/config';

export function useSignalR() {
  const { token } = useSession();
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/signalr`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveMessage', (message) => {
      // Append to TanStack Query cache for that channel
      queryClient.setQueryData(['messages', message.channelId], (old) =>
        appendToCache(old, message)
      );
    });

    connection.on('ReceiveReaction', (reaction) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', reaction.messageId] });
    });

    connection.onreconnected(async () => {
      await fetch(`${API_BASE_URL}/signalr/rejoin-channels`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    connection.start().then(() => {
      fetch(`${API_BASE_URL}/signalr/rejoin-channels`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    // Reconnect on app foreground
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && connection.state === HubConnectionState.Disconnected) {
        connection.start();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      sub.remove();
      connection.stop();
    };
  }, [token]);

  return connectionRef;
}
```

---

## Navigation Architecture

### Converting messages.tsx to a Stack

Current state: `src/app/(tabs)/messages.tsx` — a single placeholder screen.

Required state: `src/app/(tabs)/messages/` — directory with Stack navigator.

**Steps:**
1. Delete `src/app/(tabs)/messages.tsx`
2. Create `src/app/(tabs)/messages/_layout.tsx` with `<Stack>`
3. Create `src/app/(tabs)/messages/index.tsx` with the channel list
4. Create `src/app/(tabs)/messages/[channelId].tsx` with the message thread

The tab layout `src/app/(tabs)/_layout.tsx` references `name="messages"` — this **does not need to change**. Expo Router resolves `messages` to the `messages/` directory automatically.

**Channel thread navigation:**
```typescript
// From index.tsx (channel list), navigate to thread:
import { useRouter } from 'expo-router';
const router = useRouter();
router.push(`/messages/${channel.id}`);

// In [channelId].tsx, get the ID:
import { useLocalSearchParams } from 'expo-router';
const { channelId } = useLocalSearchParams<{ channelId: string }>();
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | None — Wave 0 gap |
| Quick run command | `cd backend && npx jest --testPathPattern=messaging` (after setup) |
| Full suite command | `cd backend && npx jest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MSG-01 | GET /channels returns family channels | unit/integration | `jest tests/channels.test.ts -t "GET /channels"` | ❌ Wave 0 |
| MSG-02 | POST /channels creates channel, POST /families auto-creates #general | unit/integration | `jest tests/channels.test.ts -t "channel creation"` | ❌ Wave 0 |
| MSG-03 | POST /messages persists and broadcasts | integration | `jest tests/messages.test.ts -t "send message"` | ❌ Wave 0 |
| MSG-04 | SignalR ReceiveMessage fires on other clients | manual-only | — manual | n/a |
| MSG-05 | GET /messages returns history with cursor pagination | unit/integration | `jest tests/messages.test.ts -t "pagination"` | ❌ Wave 0 |
| MSG-06 | Messages include sender_name and created_at | unit | `jest tests/messages.test.ts -t "message shape"` | ❌ Wave 0 |
| MSG-07 | POST /reactions toggles reaction; SignalR fires | integration | `jest tests/reactions.test.ts` | ❌ Wave 0 |

**MSG-04 (real-time delivery) is manual-only:** Verifying that a second client receives a SignalR push requires two active WebSocket connections; unit tests cannot cover this in < 30 seconds.

### Wave 0 Gaps
- [ ] `backend/tests/channels.test.ts` — covers MSG-01, MSG-02
- [ ] `backend/tests/messages.test.ts` — covers MSG-03, MSG-05, MSG-06
- [ ] `backend/tests/reactions.test.ts` — covers MSG-07
- [ ] `backend/jest.config.ts` — test framework setup
- [ ] Framework install: `cd backend && npm install --save-dev jest ts-jest @types/jest`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Azure SignalR Service | MSG-03, MSG-04 | Unknown | — | None — must provision |
| Node.js fetch | SignalR REST API calls from backend | ✓ | Node 18+ (ts-node config) | Use axios |
| @microsoft/signalr (npm) | MSG-03, MSG-04 client | Not yet installed | 10.0.0 | None |
| @shopify/flash-list (npm) | MSG-05 message rendering | Not yet installed | 2.3.1 | None |

**Missing dependencies with no fallback:**
- Azure SignalR Service instance must be provisioned (Azure Portal or CLI) before this phase can be verified end-to-end. The `AZURE_SIGNALR_ENDPOINT` and `AZURE_SIGNALR_ACCESS_KEY` (or connection string) env vars must be set. Local development can mock SignalR by skipping broadcast; real-time delivery requires the service.

**Missing dependencies with fallback:**
- None — both npm packages install cleanly.

**Provisioning note:** Azure SignalR Service Free tier supports 20 concurrent connections and 20,000 messages/day — sufficient for a 5-10 person family app in development and production v1.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FlatList for chat | FlashList (Shopify) | ~2022 | FlatList is explicitly deprecated for chat UIs; FlashList required |
| polling for real-time | WebSocket (SignalR) | — | No polling needed; SignalR push is the standard |
| OFFSET pagination | Keyset/cursor pagination | — | OFFSET performs O(n) scans; cursor is O(log n) with index |
| `signalr` npm package (old) | `@microsoft/signalr` | ~2020 | `signalr` is the legacy ASP.NET package; `@microsoft/signalr` is for ASP.NET Core and Azure |

**Deprecated/outdated:**
- `react-native-signalr` (olofd/react-native-signalr): Abandoned package; does not support `@microsoft/signalr` v5+. Use `@microsoft/signalr` directly in React Native — it works without native modules.
- Azure SignalR REST API v1.0-preview: Obsolete. Use v1.0 (stable, standard port, no separate port 5002 needed).
- SignalR Serverless mode with Azure Functions: Adds infrastructure complexity unnecessarily. Default mode with Express is correct for this project.

---

## Open Questions

1. **Azure SignalR Service provisioning**
   - What we know: The service must be created in Azure before the negotiate endpoint works.
   - What's unclear: Whether the developer has already provisioned a SignalR Service instance.
   - Recommendation: Plan should include a Wave 0 task to provision the service and configure env vars (`AZURE_SIGNALR_ENDPOINT`, `AZURE_SIGNALR_ACCESS_KEY`). Can be provisioned via Azure Portal in 2 minutes (Free tier).

2. **#general auto-creation trigger location**
   - What we know: `POST /families` in `families.ts` creates a family. D-03 says #general auto-creates on family creation.
   - What's unclear: Whether to do it in the same transaction as family INSERT, or as a separate step.
   - Recommendation: Same SQL batch as family creation — use a single round-trip to INSERT both `families` row and `channels` row. This prevents orphaned families without #general.

3. **Unread state tracking (D-04: bold channel names)**
   - What we know: D-04 requires bold channel names for unread. MSG-10 (badge counts) is v2.
   - What's unclear: How to track "last read" per user per channel without a full read receipts system.
   - Recommendation: Store `last_read_at` per user per channel in a `channel_reads` table (user_id, channel_id, last_read_at). Compare against channel's `last_message_at` to determine if there are unread messages. Simple boolean — no counts. Update `last_read_at` when user opens a channel.

4. **SignalR hub naming**
   - What we know: The hub name appears in the SignalR URL and group API calls.
   - What's unclear: Whether to use one hub for all families or per-family hubs.
   - Recommendation: Single hub named `familyhub`. Group the messages by `channelId`. Family isolation is via the channel UUIDs (only family members know their channel IDs via the API, which is protected by auth).

---

## Project Constraints (from CLAUDE.md)

All actionable directives from `CLAUDE.md` that affect this phase:

| Constraint | Impact on Phase 2 |
|------------|------------------|
| **Platform: React Native (Expo) — iOS + Android** | @microsoft/signalr must work without native modules — it does (pure JS/WebSocket) |
| **Backend: Azure-native — no Supabase/Firebase** | Use Azure SignalR Service; no Supabase Realtime |
| **FlashList mandatory for message rendering** | Cannot use FlatList; must install @shopify/flash-list |
| **Styling: React Native StyleSheet with theme constants** | No NativeWind; use `useThemeColors()`, `Spacing`, `Typography` from `src/constants/theme.ts` |
| **State: Zustand (client) + TanStack Query (server)** | SignalR connection in Zustand store; message list in TanStack Query cache |
| **Auth: JWT via `auth_token` in SecureStore** | Pass JWT as `accessTokenFactory` for SignalR negotiate |
| **Backend pattern: Express + mssql** | New routes follow families.ts pattern; mssql parameterized queries |
| **GSD workflow enforcement** | All file edits via GSD execute-phase |

---

## Sources

### Primary (HIGH confidence)
- [Client negotiation in Azure SignalR Service — Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-concept-client-negotiation) — Negotiate endpoint format, redirect response shape, JavaScript Express example with connection string JWT
- [Azure SignalR Service REST API Reference — Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-reference-data-plane-rest-api) — All REST API endpoints verified: broadcast to group, add user to group, authentication via AccessKey JWT
- [Azure SignalR REST API Quickstart — Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-quickstart-rest-api) — Request body format `{"target": "...", "arguments": [...]}`, API v1.0 endpoint URLs
- [TanStack Query Optimistic Updates — Official Docs](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) — onMutate/onError/onSettled pattern with cache rollback
- [Expo Router Common Navigation Patterns — Official Docs](https://docs.expo.dev/router/basics/common-navigation-patterns/) — Nested Stack inside Tab file structure
- `npm view @microsoft/signalr version` → 10.0.0 (verified 2026-04-05)
- `npm view @shopify/flash-list version` → 2.3.1 (verified 2026-04-05)

### Secondary (MEDIUM confidence)
- [Azure SignalR Background Connection Loss — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/587337/signal-r-in-react-naive-losses-connection-when-app) — AppState reconnection strategy verified against React Native AppState docs
- [SignalR Group Membership Persistence — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/signalr/overview/guide-to-the-api/working-with-groups) — Confirmed group membership is ephemeral per-connection; database persistence required for permanent membership tracking

### Tertiary (LOW confidence — needs validation)
- SignalR reconnect behavior on WiFi/cellular network transitions in React Native: Known from multiple community sources but specific timing behavior varies by OS version and device. Validate with real devices during implementation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions verified via npm registry 2026-04-05
- Architecture (SignalR negotiate flow): HIGH — verified against official Microsoft Learn docs (updated 2026-03-25)
- Architecture (REST API broadcast): HIGH — verified against official REST API reference
- Architecture (Expo Router nested stack): HIGH — verified against official Expo Router docs
- Pitfalls (background reconnect): MEDIUM — confirmed by community + Q&A but timing varies by platform
- Pitfalls (duplicate optimistic messages): MEDIUM — standard TanStack Query challenge, solutions well-documented

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (Azure SignalR REST API is stable; @microsoft/signalr releases infrequently)
