# Phase 4: Tasks - Research

**Researched:** 2026-04-06
**Domain:** CRUD task list with real-time sync (Azure SQL + Express + SignalR + React Native)
**Confidence:** HIGH

## Summary

Phase 4 is a straightforward CRUD + real-time sync feature that mirrors the messaging phase pattern. The
backend needs a `tasks` table in Azure SQL, an Express router for add/toggle/delete, and SignalR
broadcast events. The frontend replaces the placeholder `tasks.tsx` screen with a list UI, a pinned
input bar, swipe-to-delete, and SignalR event handlers wired into TanStack Query cache.

All architectural decisions are settled in CONTEXT.md. No new libraries are needed — the entire
implementation uses patterns and dependencies already proven in Phase 2. The only genuinely new
concern is swipe-to-delete UX, which requires `react-native-gesture-handler` (already a transitive
Expo dependency) and careful attention to the Reanimated swipe pattern.

**Primary recommendation:** Clone the messaging persist-first-then-broadcast pattern verbatim.
New additions are limited to: (1) task-specific SQL schema, (2) tasks Express router, (3) three new
SignalR broadcast functions, (4) task API types + fetch helpers in `api.ts`, (5) tasks screen
component with swipe-to-delete and pinned input.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Task List Layout**
- D-01: Card-based layout — each task in a card showing checkbox, task name, who added it, and relative time ("Added by Mom · 2h ago")
- D-02: Completed tasks get strikethrough text, fade slightly, and sink below active tasks with a brief animation (~1 second delay before sliding down)
- D-03: Tasks ordered newest first (most recently added at top) within each group (active / completed)
- D-04: Swipe left on a task card to reveal a red delete button (standard iOS/Android swipe-to-delete pattern)
- D-05: Completed tasks show who completed them — card displays both "Added by Mom" and "Done by Dad" when checked off

**Add Task Interaction**
- D-06: Inline text input pinned at bottom of screen with an add button — always visible, like a chat input bar
- D-07: Task is name-only — no description, notes, or other fields
- D-08: Add button is disabled (grayed out) when input is empty — prevents empty tasks
- D-09: No animation on task add — task just appears in the list
- D-10: Auto-focus the input when the task list is empty; otherwise require a tap to focus

**Completed Task Behavior**
- D-11: Tap a completed task again to uncheck it (simple toggle — no snackbar/undo needed)
- D-12: Delete completed tasks individually via swipe-to-delete — no "Clear all completed" button

**Real-time Sync**
- D-13: SignalR for instant updates plus pull-to-refresh as fallback
- D-14: Persist-first, then broadcast via SignalR — same pattern as messaging
- D-15: Conflict resolution: last write wins, silently — duplicate deletes get "not found" which is silently ignored

### Claude's Discretion
- Visual indicator for tasks added by other family members in real-time (subtle highlight, no highlight, etc.)
- Card styling details (shadow, border radius, spacing)
- Empty state design
- Swipe-to-delete animation and confirmation behavior
- Task name character limit and validation rules
- Error handling for failed task operations

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TASK-01 | User can view a shared family task list | GET /tasks endpoint + TanStack Query fetch on screen mount |
| TASK-02 | User can add a task to the list | POST /tasks endpoint + optimistic cache insert + SignalR TaskAdded broadcast |
| TASK-03 | User can check off a completed task | PATCH /tasks/:id endpoint + optimistic toggle + SignalR TaskUpdated broadcast |
| TASK-04 | User can delete a task from the list | DELETE /tasks/:id endpoint + optimistic removal + SignalR TaskDeleted broadcast |
| TASK-05 | Task list syncs across all family members in real-time | SignalR event handlers in useSignalR hook update TanStack Query cache for all connected clients |
</phase_requirements>

---

## Standard Stack

All dependencies already installed. No new packages required.

### Core (existing — no install needed)
| Library | Version | Purpose | Already Used In |
|---------|---------|---------|----------------|
| `mssql` | existing | Azure SQL queries | All backend routes |
| `express` | existing | HTTP router | All backend routes |
| `jsonwebtoken` | existing | JWT auth middleware | `authenticate.ts` |
| `@microsoft/signalr` | existing | Real-time broadcast (client) | `useSignalR.ts` |
| `@tanstack/react-query` | existing | Server state + cache | All screen hooks |
| `zustand` | existing | Client/session state | `useSession`, messaging store |
| `react-native-reanimated` | existing (Expo) | Swipe animation | Already available |
| `react-native-gesture-handler` | existing (Expo) | Swipe gesture detection | Available as Expo dep |

### Supporting (discretion)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@expo/vector-icons` (Ionicons) | existing | Checkbox icon, delete icon | Already used in `tasks.tsx` placeholder |

**No new npm installs required.** [VERIFIED: codebase grep of package.json + existing imports]

## Architecture Patterns

### Backend Pattern (established in Phase 2)

```
backend/src/
├── routes/tasks.ts       # New — mirrors messages.ts pattern
├── db/schema.sql         # Append tasks table DDL
├── lib/signalr.ts        # Add broadcastTaskAdded/Updated/Deleted
└── index.ts              # Register tasksRouter
```

### Frontend Pattern (established in Phase 2)

```
src/
├── app/(tabs)/tasks.tsx         # Replace placeholder — main screen
├── components/tasks/
│   ├── TaskCard.tsx             # Card with checkbox, name, meta, swipe-delete
│   └── AddTaskInput.tsx         # Pinned bottom input bar
├── hooks/useTasks.ts            # TanStack Query fetch + mutations
├── lib/api.ts                   # Add Task types + CRUD functions
└── hooks/useSignalR.ts          # Extend with task event handlers
```

### Pattern 1: Persist-First Broadcast (established D-14)

```typescript
// Source: backend/src/routes/messages.ts (proven pattern)
// 1. Validate input
// 2. INSERT into Azure SQL
// 3. Broadcast via SignalR (fire-and-forget, failure does not roll back)
// 4. Return 201 with persisted record
broadcastTaskEvent(familyId, payload).catch((err) => {
  console.error('SignalR broadcast failed (task already persisted):', err);
});
```

**Key difference from messaging:** Tasks broadcast to a `family-tasks-{familyId}` group rather than
a per-channel group. All family members are in this group (join on connect, same as channels).

### Pattern 2: SignalR Group for Tasks

Messaging uses one SignalR group per channel (`channelId`). Tasks use one group per family
(`family-tasks-{familyId}`). The existing `join-channels` endpoint in `signalr.ts` should be
extended (or a new `/signalr/join-tasks` endpoint added) to add the user to this family-scoped group.

**Recommended:** Extend `POST /signalr/join-channels` to also join the tasks group, so `useSignalR`
needs no new API call. Alternatively, rename the endpoint to `/signalr/join-groups` for clarity —
Claude's discretion.

### Pattern 3: TanStack Query Cache Updates (established in Phase 2)

```typescript
// Source: src/hooks/useSignalR.ts handleReceiveMessage pattern
// On TaskAdded SignalR event: prepend to ['tasks'] query cache
queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
  if (!old) return [task];
  const exists = old.some((t) => t.id === task.id);
  if (exists) return old; // dedup with optimistic
  return [task, ...old];
});

// On TaskUpdated: update in place
queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
  old?.map((t) => t.id === task.id ? task : t) ?? []
);

// On TaskDeleted: filter out
queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
  old?.filter((t) => t.id !== taskId) ?? []
);
```

### Pattern 4: Swipe-to-Delete

Use `react-native-gesture-handler` `Swipeable` component (already available via Expo). The pattern:
- Render right-action (red delete button) via `renderRightActions` prop
- On swipe confirm: call delete mutation, optimistically remove from cache
- No confirmation dialog (D-12 — individual delete, last-write-wins D-15)

[ASSUMED] `Swipeable` from `react-native-gesture-handler` is the standard Expo-compatible swipe
component. Verify it doesn't conflict with Reanimated v3 in SDK 55 before implementing.
Alternatively, `ReanimatedSwipeable` from `react-native-gesture-handler/ReanimatedSwipeable`
is the Reanimated v3 native variant.

### Pattern 5: Completed-Task Sort + Animation (D-02)

Completed tasks sink below active tasks with ~1 second delay. Implementation:

```typescript
// Sort tasks: active newest-first, then completed newest-first
const activeTasks = tasks.filter(t => !t.completedAt).sort(byCreatedAtDesc);
const completedTasks = tasks.filter(t => t.completedAt).sort(byCompletedAtDesc);
const sorted = [...activeTasks, ...completedTasks];
```

The 1-second delay before visual sink: use `setTimeout` after toggle mutation resolves to trigger
a re-sort, or use a local `pendingComplete` set that delays removal from active list.

### Anti-Patterns to Avoid

- **Polling for real-time:** Do not use `refetchInterval` — SignalR handles push; pull-to-refresh
  is the explicit fallback (D-13)
- **Missing family_id scope:** All SQL queries MUST filter by `req.familyId` — tasks are
  family-scoped, not global
- **Blocking on broadcast failure:** SignalR broadcast is fire-and-forget after persist (D-14)
- **Custom swipe implementation:** Do not hand-roll swipe gesture; use `Swipeable` from
  `react-native-gesture-handler`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Swipe gesture | Custom PanResponder swipe | `Swipeable` from react-native-gesture-handler | Handles velocity, threshold, cancel, direction — dozens of edge cases |
| Real-time broadcast | Polling interval | SignalR events (existing hook) | Already implemented; polling wastes battery |
| Relative timestamps | Custom date formatter | `Intl.RelativeTimeFormat` or simple "Xh ago" helper | Standard JS — no lib needed; messaging already has this pattern |
| Optimistic updates | Manual state management | TanStack Query `useMutation` + `onMutate` | Cache rollback on failure is built in |

## Common Pitfalls

### Pitfall 1: Tasks Group Not Joined on Reconnect

**What goes wrong:** After SignalR reconnects (network switch, app foreground), the client re-joins
channel groups via `joinChannels()` but does NOT re-join the tasks group if it's added separately.
**Why it happens:** `onreconnected` callback only calls `joinChannels()` — any new group join must
be added to the same callback.
**How to avoid:** Whatever endpoint joins the tasks group must be called from the same
`onreconnected` handler in `useSignalR`.
**Warning signs:** Task updates stop arriving after a network transition.

### Pitfall 2: Duplicate Task on Optimistic + SignalR Race

**What goes wrong:** User adds a task; optimistic update inserts temp record; SignalR `TaskAdded`
event arrives before mutation resolves; two records appear in the list.
**Why it happens:** Same race as messaging (already solved there with sender+text dedup).
**How to avoid:** Dedup in SignalR handler by `task.id` AND by `(addedById + name)` for the temp
record. Use a `tempId` (e.g., `temp-{Date.now()}`) and replace on resolution.

### Pitfall 3: Delete "Not Found" on Race

**What goes wrong:** Two family members swipe-delete the same task simultaneously. The second DELETE
returns 404.
**Why it happens:** Task already gone when second request arrives.
**How to avoid:** Per D-15, silently ignore 404 on DELETE — treat as success (task is gone either
way). Code: catch the error, check if it's a 404, and resolve the mutation as success.

### Pitfall 4: Missing `GestureHandlerRootView`

**What goes wrong:** `Swipeable` gestures do not respond; no error thrown.
**Why it happens:** `react-native-gesture-handler` requires `GestureHandlerRootView` wrapping the
app root. It may or may not be present in the current layout.
**How to avoid:** Verify `_layout.tsx` wraps content with `GestureHandlerRootView`. If missing,
add it at the root level — not per-screen.
**Warning signs:** Swipe does nothing; tap-through works fine.

### Pitfall 5: Completed-At vs Updated-At Ambiguity

**What goes wrong:** Toggling a task back to incomplete sets `completed_at` to NULL correctly, but
the "Done by Dad" attribution still shows on the card because the UI caches the old state.
**Why it happens:** SignalR `TaskUpdated` payload must include `completedById: null` and
`completedByName: null` when unchecking so the card clears the attribution.
**How to avoid:** Always broadcast the full task record (not a delta) on every update.

## Code Examples

### SQL Schema (tasks table)

```sql
-- Source: backend/src/db/schema.sql pattern — append for Phase 4
CREATE TABLE tasks (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  family_id       UNIQUEIDENTIFIER NOT NULL REFERENCES families(id),
  name            NVARCHAR(200) NOT NULL,
  added_by_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  added_by_name   NVARCHAR(100) NOT NULL,
  completed_at    DATETIME2 NULL,
  completed_by_id UNIQUEIDENTIFIER NULL REFERENCES users(id),
  completed_by_name NVARCHAR(100) NULL,
  created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  INDEX ix_tasks_family_created (family_id, created_at DESC)
);
```

Notes:
- `added_by_name` and `completed_by_name` denormalized into the row — same pattern as
  `senderName` in messages (avoids JOIN on every broadcast payload fetch)
- No `updated_at` column needed — `completed_at` IS the state change timestamp

### Task API Types (src/lib/api.ts addition)

```typescript
// Source: existing Message interface pattern in src/lib/api.ts
export interface Task {
  id: string;
  familyId: string;
  name: string;
  addedById: string;
  addedByName: string;
  completedAt: string | null;
  completedById: string | null;
  completedByName: string | null;
  createdAt: string;
}

export async function fetchTasks(token: string): Promise<{ tasks: Task[] }> {
  return apiFetch('/tasks', token);
}

export async function addTask(token: string, name: string): Promise<{ task: Task }> {
  return apiFetch('/tasks', token, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function toggleTask(token: string, taskId: string, completed: boolean): Promise<{ task: Task }> {
  return apiFetch(`/tasks/${taskId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

export async function deleteTask(token: string, taskId: string): Promise<void> {
  await apiFetch(`/tasks/${taskId}`, token, { method: 'DELETE' });
}
```

### SignalR Broadcast Functions (backend/src/lib/signalr.ts additions)

```typescript
// Source: existing broadcastToChannel / broadcastReaction pattern
async function broadcastToFamily(familyId: string, target: string, payload: object): Promise<void> {
  const groupName = `family-tasks-${familyId}`;
  const url = `${endpoint}/api/v1/hubs/${hub}/groups/${groupName}`;
  const token = generateSignalRJwt(url);
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, arguments: [payload] }),
  });
}

export async function broadcastTaskAdded(familyId: string, task: object): Promise<void> {
  return broadcastToFamily(familyId, 'TaskAdded', task);
}

export async function broadcastTaskUpdated(familyId: string, task: object): Promise<void> {
  return broadcastToFamily(familyId, 'TaskUpdated', task);
}

export async function broadcastTaskDeleted(familyId: string, taskId: string): Promise<void> {
  return broadcastToFamily(familyId, 'TaskDeleted', { taskId });
}
```

### Express Router Skeleton (backend/src/routes/tasks.ts)

```typescript
// Source: backend/src/routes/messages.ts pattern
import { Router, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { broadcastTaskAdded, broadcastTaskUpdated, broadcastTaskDeleted } from '../lib/signalr';

export const tasksRouter = Router();

// GET /tasks — fetch all family tasks (active + completed)
tasksRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  // SELECT * FROM tasks WHERE family_id = @familyId ORDER BY created_at DESC
});

// POST /tasks — add a task
tasksRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  // Validate name, INSERT, broadcastTaskAdded (fire-and-forget), return 201
});

// PATCH /tasks/:id — toggle completion
tasksRouter.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  // Verify family_id ownership, UPDATE completed_at/completed_by, broadcastTaskUpdated
});

// DELETE /tasks/:id — delete a task
tasksRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  // Verify family_id ownership, DELETE, broadcastTaskDeleted
  // Return 200 even if 0 rows affected (D-15: duplicate delete is success)
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `FlatList` for lists | `FlashList` (if long) | Phase 2 decision | Tasks list is short (family of 5-10, modest task count) — `FlatList` is acceptable here, but FlashList is already installed |
| `PanResponder` swipe | `Swipeable` from RNGH | Expo SDK 50+ | Less boilerplate, handles edge cases |
| Separate state for optimistic | TanStack Query `onMutate` | v5 | Built-in rollback on error |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Swipeable` from `react-native-gesture-handler` works with Reanimated v3 in SDK 55 without conflicts | Architecture Patterns / Pitfall 4 | May need `ReanimatedSwipeable` variant instead — same API, different import |
| A2 | `GestureHandlerRootView` is already present in `_layout.tsx` from Phase 2 (messaging uses gesture handler) | Pitfall 4 | If missing, swipes will silently fail — one-line fix |

## Open Questions

1. **GestureHandlerRootView presence**
   - What we know: Gesture handler is an Expo transitive dep; messaging may not have needed it explicitly
   - What's unclear: Whether `_layout.tsx` already has `GestureHandlerRootView`
   - Recommendation: Wave 0 task — read `_layout.tsx` and add `GestureHandlerRootView` if absent

2. **Join-tasks group endpoint: extend or separate?**
   - What we know: Current `POST /signalr/join-channels` adds user to per-channel groups
   - What's unclear: Whether to extend it to also join `family-tasks-{familyId}` or add a separate call
   - Recommendation: Extend the existing endpoint — simpler, single reconnect callback call

## Environment Availability

Step 2.6: SKIPPED — Phase 4 is a code/config change using tools already verified in Phases 1-3.
No new external services or CLI tools are required.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected (no test files or config found in codebase) |
| Config file | None |
| Quick run command | Manual: run app in Expo Go, exercise task CRUD |
| Full suite command | Manual: all four success criteria from phase brief |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TASK-01 | Task list loads and displays family tasks | manual smoke | — | ❌ no test infra |
| TASK-02 | Add task — appears immediately for all family members | manual e2e | — | ❌ no test infra |
| TASK-03 | Check off task — completed state visible to all | manual e2e | — | ❌ no test infra |
| TASK-04 | Delete task — disappears for all members | manual e2e | — | ❌ no test infra |
| TASK-05 | Real-time sync — updates arrive without refresh | manual e2e | — | ❌ no test infra |

### Sampling Rate

- Per task commit: Manual verification in Expo Go against dev backend
- Per wave merge: All four success criteria checked with two simulator instances
- Phase gate: All success criteria pass before `/gsd-verify-work`

### Wave 0 Gaps

- No automated test framework in project — all validation is manual Expo Go smoke testing
- Recommend testing with two devices/simulators simultaneously to verify real-time sync (TASK-05)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via existing `authenticate` middleware — no changes needed |
| V3 Session Management | no | Stateless JWT — no server sessions |
| V4 Access Control | yes | All task routes filter by `req.familyId` — tasks never cross family boundaries |
| V5 Input Validation | yes | Task name: trim + max length (200 chars); `completed` boolean validated server-side |
| V6 Cryptography | no | No new crypto — existing JWT pattern covers auth |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Task access across families | Elevation of Privilege | All SQL queries include `AND family_id = @familyId` from JWT payload |
| Empty/whitespace task names | Tampering | `name.trim().length === 0` → 400 Bad Request |
| Delete another family's task via ID | Elevation of Privilege | DELETE verifies `family_id` ownership before deleting |
| Oversized task name | Denial of Service | `name.length > 200` → 400 Bad Request; SQL column is `NVARCHAR(200)` |

## Sources

### Primary (HIGH confidence)
- `backend/src/routes/messages.ts` — persist-first pattern, SQL query structure, broadcastToChannel
- `backend/src/lib/signalr.ts` — broadcast function pattern
- `src/hooks/useSignalR.ts` — cache update pattern, reconnect handler
- `src/lib/api.ts` — apiFetch helper, interface patterns
- `backend/src/db/schema.sql` — table DDL patterns, index conventions
- `backend/src/middleware/authenticate.ts` — familyId scoping from JWT

### Secondary (MEDIUM confidence)
- [ASSUMED] react-native-gesture-handler `Swipeable` API — standard Expo pattern, not re-verified
  against SDK 55 docs in this session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in existing codebase
- Architecture: HIGH — direct clone of Phase 2 patterns with task-specific adaptations
- Pitfalls: HIGH — identified from codebase inspection (race conditions, reconnect gap, swipe root)
- Swipe component variant: MEDIUM — standard pattern but not re-verified for SDK 55 + Reanimated v3

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable stack, no fast-moving dependencies)
