---
phase: 04-tasks
plan: "02"
subsystem: tasks-frontend
tags: [tasks, tanstack-query, signalr, swipeable, optimistic-updates]
dependency_graph:
  requires: [04-01]
  provides: [tasks-ui, tasks-real-time-sync]
  affects: [src/app/_layout.tsx, src/hooks/useSignalR.ts]
tech_stack:
  added: [react-native-gesture-handler/Swipeable]
  patterns: [optimistic-updates, pending-complete-delay, signalr-cache-sync]
key_files:
  created:
    - src/hooks/useTasks.ts
    - src/components/tasks/TaskCard.tsx
    - src/components/tasks/AddTaskBar.tsx
  modified:
    - src/lib/api.ts
    - src/app/(tabs)/tasks.tsx
    - src/app/_layout.tsx
    - src/hooks/useSignalR.ts
decisions:
  - "GestureHandlerRootView added at app root (required for Swipeable to work in nested screens)"
  - "pendingComplete Set tracks recently-completed tasks during 1s sort-delay (D-02)"
  - "useDeleteTask silently ignores 404 errors — task already removed by another client (D-15)"
  - "handleTaskAdded dedup matches temp- prefix + addedById + name to replace optimistic entries"
metrics:
  duration: ~15min
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_changed: 7
---

# Phase 04 Plan 02: Tasks Frontend Summary

**One-liner:** TanStack Query task hooks with optimistic updates, Swipeable card with strikethrough/metadata, pinned AddTaskBar, and SignalR real-time sync with dedup.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | API types, hooks, components, and task screen | db0ef31 | api.ts, useTasks.ts, TaskCard.tsx, AddTaskBar.tsx, tasks.tsx, _layout.tsx |
| 2 | SignalR event handlers for real-time task sync | a396c6b | useSignalR.ts |

## What Was Built

### Task Types and API (`src/lib/api.ts`)
Added `Task` interface with all fields (id, familyId, name, addedById, addedByName, completedAt, completedById, completedByName, createdAt). Added `fetchTasks`, `addTask`, `toggleTask`, `deleteTask` API functions using existing `apiFetch` helper.

### TanStack Query Hooks (`src/hooks/useTasks.ts`)
- `useTasks()`: Query with `queryKey: ['tasks']`, returns sorted tasks array
- `useAddTask()`: Optimistic insert with `temp-{timestamp}` ID, replaced by server response on success
- `useToggleTask()`: Optimistic toggle with full rollback on error; server response updates cache on success
- `useDeleteTask()`: Optimistic removal with 404-silent error handling

### TaskCard (`src/components/tasks/TaskCard.tsx`)
- `Swipeable` from react-native-gesture-handler with 80px red Delete action
- `checkmark-circle` (completed) / `ellipse-outline` (active) Ionicons checkbox
- `line-through` text decoration + opacity 0.7 for completed tasks
- "Added by {name} · {relativeTime}" metadata line; "Done by {name}" when completed
- `accessibilityRole="checkbox"` with proper `accessibilityState`

### AddTaskBar (`src/components/tasks/AddTaskBar.tsx`)
- `maxLength={200}` on TextInput; `autoFocus` prop passed through
- Add button disabled (opacity 0.4) when input is empty or whitespace-only
- `returnKeyType="send"` with `onSubmitEditing` handler

### Tasks Screen (`src/app/(tabs)/tasks.tsx`)
- Empty state: checkmark icon + "No tasks yet" heading + body text
- Active tasks sorted newest-first by `createdAt`; completed tasks sorted by `completedAt`
- `pendingComplete` Set delays re-sort by 1000ms after toggle (D-02 sink animation)
- Pull-to-refresh via `RefreshControl` (D-13)
- `KeyboardAvoidingView` so AddTaskBar lifts above keyboard
- Alert-based error feedback for add/delete failures

### SignalR Handlers (`src/hooks/useSignalR.ts`)
- `handleTaskAdded`: deduplicates against existing temp- entries, replaces or prepends
- `handleTaskUpdated`: full task record replace by ID
- `handleTaskDeleted`: filters task out of cache by `taskId`
- All three registered on connection and included in dependency array

### GestureHandlerRootView (`src/app/_layout.tsx`)
Added `import 'react-native-gesture-handler'` as first import and wrapped layout with `<GestureHandlerRootView style={{ flex: 1 }}>` — required for Swipeable to function in nested tab screens.

## Checkpoint: Human Verify (Task 3)

**Status:** Auto-approved.

Full verification checklist (11 steps) covering add, toggle, uncomplete, swipe-delete, pull-to-refresh, and optional real-time sync across two devices — auto-approved by orchestrator.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired to real API calls and SignalR events.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model.

## Self-Check

- [x] src/lib/api.ts — contains `export interface Task` with all required fields
- [x] src/hooks/useTasks.ts — exports useTasks, useAddTask, useToggleTask, useDeleteTask
- [x] src/components/tasks/TaskCard.tsx — Swipeable, checkmark-circle, ellipse-outline, line-through, Delete, accessibilityRole checkbox
- [x] src/components/tasks/AddTaskBar.tsx — maxLength 200, disabled state
- [x] src/app/(tabs)/tasks.tsx — No tasks yet empty state, onRefresh, pendingComplete delay
- [x] src/app/_layout.tsx — GestureHandlerRootView, react-native-gesture-handler first import
- [x] src/hooks/useSignalR.ts — TaskAdded/TaskUpdated/TaskDeleted handlers with dedup and cache updates
- [x] Commits db0ef31 and a396c6b exist

## Self-Check: PASSED
