# Phase 4: Tasks - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Shared family task list with add, check-off, delete, and real-time sync. Family members can maintain a single shared task list that stays in sync across all devices. No multiple lists, no task assignment, no due dates, no categories.

</domain>

<decisions>
## Implementation Decisions

### Task List Layout
- **D-01:** Card-based layout — each task in a card showing checkbox, task name, who added it, and relative time ("Added by Mom · 2h ago")
- **D-02:** Completed tasks get strikethrough text, fade slightly, and sink below active tasks with a brief animation (~1 second delay before sliding down)
- **D-03:** Tasks ordered newest first (most recently added at top)
- **D-04:** Swipe left on a task card to reveal a red delete button (standard iOS/Android swipe-to-delete pattern)
- **D-05:** Completed tasks show who completed them — card displays both "Added by Mom" and "Done by Dad" when checked off

### Add Task Interaction
- **D-06:** Inline text input pinned at bottom of screen with an add button — always visible, like a chat input bar
- **D-07:** Task is name-only — no description, notes, or other fields
- **D-08:** Add button is disabled (grayed out) when input is empty — prevents empty tasks
- **D-09:** No animation on task add — task just appears in the list
- **D-10:** Auto-focus the input when the task list is empty (encourages adding the first task); otherwise require a tap to focus

### Completed Task Behavior
- **D-11:** Tap a completed task again to uncheck it (simple toggle — no snackbar/undo needed)
- **D-12:** Delete completed tasks individually via swipe-to-delete — no "Clear all completed" button

### Real-time Sync
- **D-13:** SignalR for instant updates (task adds, check-offs, deletes appear immediately for all family members) plus pull-to-refresh as fallback
- **D-14:** Persist-first, then broadcast via SignalR — same pattern as messaging (D-09 from Phase 2)
- **D-15:** Conflict resolution: last write wins, silently — duplicate deletes get "not found" which is silently ignored

### Claude's Discretion
- Visual indicator for tasks added by other family members in real-time (subtle highlight, no highlight, etc.)
- Card styling details (shadow, border radius, spacing)
- Empty state design (placeholder when no tasks exist — current placeholder already in `src/app/(tabs)/tasks.tsx`)
- Swipe-to-delete animation and confirmation behavior
- Task name character limit and validation rules
- Error handling for failed task operations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Project vision, constraints (Azure backend), key decisions
- `.planning/REQUIREMENTS.md` — TASK-01 through TASK-05 acceptance criteria

### Phase 1 Foundation (existing patterns)
- `.planning/phases/01-foundation/01-CONTEXT.md` — Auth, navigation shell, Azure SQL + Express patterns
- `backend/src/index.ts` — Express router registration pattern (add tasks router here)
- `backend/src/routes/` — Existing route files for pattern reference
- `backend/src/db/` — Database connection and schema patterns

### Phase 2 Messaging (real-time patterns)
- `.planning/phases/02-messaging/02-CONTEXT.md` — SignalR decisions, persist-first broadcast, optimistic updates
- `src/hooks/useSignalR.ts` — Existing SignalR hook to extend for task events
- `src/lib/api.ts` — API client with `apiFetch` helper (add task API functions here)

### Existing Task Tab
- `src/app/(tabs)/tasks.tsx` — Current placeholder screen to replace

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/api.ts` — `apiFetch` helper with auth header injection — add task CRUD functions here
- `src/hooks/useSignalR.ts` — SignalR connection hook — extend for task-related events
- `src/constants/theme.ts` — `useThemeColors`, `Spacing`, `Typography` design tokens used across all tabs
- `@expo/vector-icons` (Ionicons) — icon library used throughout the app

### Established Patterns
- Azure SQL + Express API: route files in `backend/src/routes/`, DB queries in `backend/src/db/`
- Persist-first, then SignalR broadcast (Phase 2 messaging pattern)
- `apiFetch` for all API calls with Bearer token auth
- Zustand for client state, TanStack Query for server state
- StyleSheet.create with theme tokens for component styling

### Integration Points
- `backend/src/index.ts` — Register new tasks router
- `src/app/(tabs)/tasks.tsx` — Replace placeholder with full task list screen
- `src/lib/api.ts` — Add task API types and functions
- SignalR hub — Add task event types (TaskAdded, TaskUpdated, TaskDeleted)
- Azure SQL — New `tasks` table in database schema

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-tasks*
*Context gathered: 2026-04-06*
