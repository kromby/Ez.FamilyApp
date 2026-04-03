# Architecture Patterns

**Domain:** Private family communication app (5-10 members, iOS + Android)
**Researched:** 2026-04-03

## Recommended Architecture

A three-tier architecture: React Native client, REST + WebSocket API server, and a PostgreSQL database. No microservices — the group size (5-10 people) and feature set don't justify the operational overhead. A single well-structured backend is appropriate.

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React Native)                 │
│                                                          │
│  Auth Screen → Family Setup / Join → Main App            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Channels │  │ Check-in │  │  Tasks   │              │
│  │ (chat)   │  │ (map)    │  │ (lists)  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │              │                     │
│  WebSocket      REST HTTP      REST HTTP                 │
└───────┼─────────────┼──────────────┼────────────────────┘
        │             │              │
┌───────▼─────────────▼──────────────▼────────────────────┐
│                  API SERVER (Node.js / NestJS)            │
│                                                          │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  WS Gateway │  │ REST API   │  │  Auth Module     │  │
│  │ (messages)  │  │ (check-ins │  │ (family code,    │  │
│  │             │  │  tasks)    │  │  JWT sessions)   │  │
│  └──────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
│         │               │                   │            │
│         └───────────────┴───────────────────┘            │
│                         │                                │
│                  ┌──────▼──────┐                         │
│                  │  Data Layer │                         │
│                  │  (Prisma ORM│                         │
│                  └──────┬──────┘                         │
└─────────────────────────┼────────────────────────────────┘
                          │
               ┌──────────▼──────────┐
               │    PostgreSQL DB     │
               │  (Supabase or        │
               │   Railway)           │
               └─────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| React Native App | All UI, local state, WebSocket client | API Server (REST + WS) |
| Auth Module | Family creation, code-based join, JWT issue/verify | DB (families, users) |
| WS Gateway | Real-time message delivery, channel rooms | DB (messages), Socket.IO rooms |
| REST API | Check-ins (write/read), tasks (CRUD) | DB (check_ins, tasks) |
| Data Layer (Prisma) | ORM, migrations, query building | PostgreSQL |
| PostgreSQL | Persistent storage for all entities | — |

**No Redis needed for this scale.** With 5-10 concurrent users, an in-process Socket.IO instance handles presence and room routing without a pub/sub adapter. Redis can be added later if the app scales.

**No separate notification service for v1.** Push notifications are explicitly deferred.

## Data Model

### Core Tables

```sql
-- Family groups
families (
  id          UUID PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(8) UNIQUE NOT NULL,   -- join code
  created_at  TIMESTAMP NOT NULL
)

-- Users (family members)
users (
  id          UUID PRIMARY KEY,
  family_id   UUID REFERENCES families(id),
  display_name VARCHAR(50) NOT NULL,
  avatar_color VARCHAR(7),                  -- hex color, no photo upload in v1
  created_at  TIMESTAMP NOT NULL
)

-- Auth sessions (simple token store, no OAuth)
sessions (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  token       VARCHAR(256) UNIQUE NOT NULL,
  expires_at  TIMESTAMP NOT NULL
)

-- Channels (topic-based)
channels (
  id          UUID PRIMARY KEY,
  family_id   UUID REFERENCES families(id),
  name        VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP NOT NULL
)

-- Messages
messages (
  id              UUID PRIMARY KEY,
  channel_id      UUID REFERENCES channels(id),
  author_id       UUID REFERENCES users(id),
  content         TEXT NOT NULL,
  created_at      TIMESTAMP NOT NULL
)
-- Index: (channel_id, created_at DESC) for pagination

-- Location check-ins (snapshot, not live tracking)
check_ins (
  id          UUID PRIMARY KEY,
  family_id   UUID REFERENCES families(id),
  user_id     UUID REFERENCES users(id),
  latitude    DECIMAL(9,6) NOT NULL,
  longitude   DECIMAL(9,6) NOT NULL,
  label       VARCHAR(100),                 -- optional user note e.g. "at school"
  created_at  TIMESTAMP NOT NULL
)
-- Only the latest check-in per user is relevant; keep all for history

-- Task lists
task_lists (
  id          UUID PRIMARY KEY,
  family_id   UUID REFERENCES families(id),
  name        VARCHAR(100) NOT NULL,         -- e.g. "Groceries", "Weekend"
  created_at  TIMESTAMP NOT NULL
)

-- Tasks
tasks (
  id            UUID PRIMARY KEY,
  list_id       UUID REFERENCES task_lists(id),
  created_by    UUID REFERENCES users(id),
  content       TEXT NOT NULL,
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by  UUID REFERENCES users(id),
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP NOT NULL
)
```

### Key Relationships

```
families ──< users          (one family, many members)
families ──< channels       (one family, many channels)
channels ──< messages       (one channel, many messages)
families ──< check_ins      (one family, many check-ins)
families ──< task_lists     (one family, many lists)
task_lists ──< tasks        (one list, many tasks)
```

## Data Flow

### Message Send Flow (real-time)
```
User types → Client emits WS event (send_message, channelId, content)
  → WS Gateway validates auth + family membership
  → Persists to messages table
  → Emits to Socket.IO room (channel:{channelId})
  → All connected family members in that channel receive the event
  → Clients append to local message list
```

### Message Load Flow (history)
```
User opens channel → Client sends REST GET /channels/:id/messages?cursor=...
  → API queries messages WHERE channel_id = ? ORDER BY created_at DESC LIMIT 50
  → Returns paginated messages
  → Client renders with oldest-first display order
```

### Check-in Flow
```
User taps "Check In" → Client requests device location (Expo Location)
  → Client sends REST POST /check-ins { lat, lng, label? }
  → API persists check_in record
  → Other family members see new check-in on next poll or refresh
  → No real-time push for check-ins in v1 (polling acceptable given small group)
```

### Task Flow
```
User adds task → Client sends REST POST /task-lists/:id/tasks { content }
  → API persists task
  → Other users see it on next list load
  → Optimistic update in client for immediate feedback
User checks task → Client sends REST PATCH /tasks/:id { is_completed: true }
  → API updates task, records completed_by + completed_at
```

### Auth / Onboarding Flow
```
Family creator:
  POST /families { name } → Server creates family + generates 8-char code
  POST /users { family_id, display_name } → Server creates user + returns JWT

Member joining:
  POST /families/join { code } → Server validates code → returns family_id
  POST /users { family_id, display_name } → Server creates user + returns JWT
```

## Patterns to Follow

### Pattern 1: Socket.IO Rooms for Channel Isolation
**What:** Each channel gets a Socket.IO room named `channel:{channelId}`. Clients join only the rooms for channels in their family. The server verifies family membership before admitting to a room.

**Why:** Prevents cross-family message leakage without any query overhead. Room membership is managed in-process.

**Example:**
```typescript
// Server: WS Gateway
@SubscribeMessage('join_channels')
handleJoinChannels(client: Socket, channelIds: string[]) {
  // verify client's family owns these channels
  channelIds.forEach(id => client.join(`channel:${id}`));
}

@SubscribeMessage('send_message')
async handleMessage(client: Socket, dto: SendMessageDto) {
  const message = await this.messageService.create(dto);
  this.server.to(`channel:${dto.channelId}`).emit('new_message', message);
}
```

### Pattern 2: JWT in WebSocket Handshake
**What:** Client passes JWT as auth header or query param during Socket.IO connection. Server validates before accepting the connection. Unauthenticated sockets are disconnected immediately.

**Why:** WS connections are long-lived; auth must happen at connection time, not per-message.

### Pattern 3: Cursor-Based Message Pagination
**What:** Messages are loaded with a `cursor` (last message ID or timestamp). The client requests the next page by passing the oldest message ID it has.

**Why:** Offset pagination breaks when new messages arrive. Cursor pagination is stable and efficient with the `(channel_id, created_at)` index.

### Pattern 4: REST for Non-Real-Time Features
**What:** Check-ins and tasks use plain REST (not WebSocket). They don't require sub-second delivery.

**Why:** WebSocket adds complexity (reconnection, state sync) without meaningful benefit for features that are checked periodically, not streamed.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing JWT in AsyncStorage Without Encryption
**What:** Saving JWTs in plain React Native AsyncStorage.
**Why bad:** AsyncStorage is unencrypted on Android. Tokens can be extracted.
**Instead:** Use `expo-secure-store` which uses Keychain (iOS) and Keystore (Android).

### Anti-Pattern 2: Polling for Messages
**What:** Using setInterval to fetch new messages via REST.
**Why bad:** Introduces latency, wastes battery, hammers the DB.
**Instead:** WebSocket is already planned — messages should always come through it.

### Anti-Pattern 3: Live Location vs Check-in Conflation
**What:** Querying the most recent check-in and presenting it as "current location."
**Why bad:** Check-ins are explicit user actions, not current position. Presenting them as live location misleads users and erodes trust.
**Instead:** Display check-ins with clear timestamps ("Shared their location 2 hours ago").

### Anti-Pattern 4: Fetching All Messages at Once
**What:** Loading entire channel history on open.
**Why bad:** Even a small family generates thousands of messages over months.
**Instead:** Load last 50 messages, paginate backward on scroll.

### Anti-Pattern 5: Single Table for All Content Types
**What:** Using the messages table to also store check-ins or task updates as "system messages."
**Why bad:** Pollutes message history, complicates queries, tight coupling between features.
**Instead:** Separate tables for each entity (as shown in the schema above).

## Build Order (Component Dependencies)

This is the critical path order — each phase enables the next.

```
1. Database schema + Prisma setup
   └─ All features depend on this

2. Auth module (family creation, join code, JWT)
   └─ All other API routes require authenticated user + family context

3. Channel + Message API (REST for history + WS Gateway for real-time)
   └─ Core value prop; validates the real-time infrastructure

4. Task lists API (REST CRUD)
   └─ Depends only on auth; no real-time required

5. Check-ins API (REST write/read)
   └─ Depends only on auth; simplest feature to add after tasks

6. React Native client (screens + navigation)
   └─ Built in parallel with or after backend; screens map 1:1 to features above
```

**Why this order:**
- Auth is a hard prerequisite for every other API route
- Messages + WebSocket validate the hardest technical piece (real-time) early, de-risking the project
- Tasks and check-ins are pure REST — low risk, implement after messaging is proven
- Client work can begin after auth + channels are stable enough to develop against

## Scalability Considerations

For a family of 5-10 people, scalability is not a concern. This table is included to document why certain "obvious" scaling patterns (Redis, horizontal scaling) are intentionally omitted from v1.

| Concern | At 5-10 users | If it ever grew |
|---------|---------------|-----------------|
| WS connections | Single Node.js process handles thousands | Add @socket.io/redis-adapter + horizontal pods |
| DB load | Single PostgreSQL instance (Supabase free tier is fine) | Read replicas, connection pooling (pgBouncer) |
| Message volume | 50-100 msgs/day estimated | Partitioning messages table by channel_id |
| Check-in frequency | A few per day | No concern even at 100x scale |

## Sources

- [Chat App System Design: Messaging Architecture](https://trueconf.com/blog/reviews-comparisons/chat-app-system-design) — MEDIUM confidence (WebSearch + WebFetch)
- [Efficient Schema Design for a Chat App using PostgreSQL](https://www.tome01.com/efficient-schema-design-for-a-chat-app-using-postgresql) — MEDIUM confidence (WebFetch)
- [Building a Scalable Facebook-style Messaging Backend with NodeJS](https://webdock.io/en/docs/how-guides/javascript-guides/building-scalable-facebook-style-messaging-backend-nodejs) — MEDIUM confidence (WebFetch)
- [Socket.IO Rooms Documentation](https://socket.io/docs/v3/rooms/) — HIGH confidence (official docs)
- [NestJS WebSocket Integration](https://deepwiki.com/nestjs/nest/6.1-socket.io-integration) — MEDIUM confidence
- [React Native Tech Stack 2026](https://webridge.co/tech-stack/react-native-tech-stack) — MEDIUM confidence
- [Realtime apps with React Native and WebSockets](https://ably.com/topic/websockets-react-native) — MEDIUM confidence
