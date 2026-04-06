# Phase 4: Tasks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 04-tasks
**Areas discussed:** Task list layout, Add task interaction, Completed task behavior, Real-time sync style

---

## Task List Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Simple checklist | Checkbox + task name on each row — like Apple Reminders | |
| Cards with metadata | Each task in a card showing name, who added it, when | ✓ |
| You decide | Claude picks based on existing app patterns | |

**User's choice:** Cards with metadata
**Notes:** User wants context on who added each task

---

### Completed task visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Strikethrough + move to bottom | Completed tasks fade and sink below active tasks | ✓ |
| Hide after a short delay | Task fades out after ~2 seconds | |
| Collapsible section | Done section at bottom, expandable/collapsible | |

**User's choice:** Strikethrough + move to bottom

---

### Attribution

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, show completer | Card shows both who added and who completed | ✓ |
| No, just who added | Only show creator, check-off is anonymous | |
| You decide | Claude picks | |

**User's choice:** Yes, show completer

---

### Delete UX

| Option | Description | Selected |
|--------|-------------|----------|
| Swipe to reveal | Swipe left to reveal red delete button | ✓ |
| Long-press menu | Long-press shows context menu with Delete | |
| Visible trash icon | Small trash icon always visible on card | |

**User's choice:** Swipe to reveal

---

### Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Newest first | Most recently added at top | ✓ |
| Manual drag-to-reorder | Users can drag tasks to prioritize | |
| You decide | Claude picks | |

**User's choice:** Newest first

---

## Add Task Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Inline input at bottom | Persistent text input pinned at bottom | ✓ |
| Floating action button | FAB opens modal/bottom sheet | |
| Header plus button | Plus icon in top-right header | |

**User's choice:** Inline input at bottom

---

### Task fields

| Option | Description | Selected |
|--------|-------------|----------|
| Name only | Just a task name, quick and lightweight | ✓ |
| Name + optional note | Task name plus expandable note field | |

**User's choice:** Name only

---

### Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Button disabled when empty | Add button grayed out until text entered | ✓ |
| You decide | Claude picks | |

**User's choice:** Button disabled when empty

---

### Add animation

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle slide-in | New card slides in with brief highlight | |
| No animation | Task just appears instantly | ✓ |
| You decide | Claude picks | |

**User's choice:** No animation

---

### Auto-focus

| Option | Description | Selected |
|--------|-------------|----------|
| Require tap | Keyboard doesn't pop up until user taps input | |
| Auto-focus on empty list | Auto-focus when no tasks exist, otherwise require tap | ✓ |

**User's choice:** Auto-focus on empty list

---

## Completed Task Behavior

### Check-off animation

| Option | Description | Selected |
|--------|-------------|----------|
| Animate to bottom after brief delay | Checkbox fills, strikethrough, then slides down after ~1s | ✓ |
| Instant reorder | Card immediately moves to bottom | |
| Stay in place | Card stays with strikethrough styling | |

**User's choice:** Animate to bottom after brief delay

---

### Undo

| Option | Description | Selected |
|--------|-------------|----------|
| Tap again to uncheck | Toggle — tap completed task to mark incomplete | ✓ |
| Snackbar with undo | Brief snackbar with Undo button | |
| No undo | Once checked, stays checked | |

**User's choice:** Tap again to uncheck

---

### Clear completed

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, 'Clear completed' button | Button to delete all done tasks with confirmation | |
| No, delete individually | Swipe-to-delete individual completed tasks | ✓ |
| You decide | Claude picks | |

**User's choice:** No, delete individually

---

## Real-time Sync Style

### Sync mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Instant via SignalR | Same pattern as messaging, immediate updates | |
| Pull-to-refresh | Manual refresh only | |
| Both | SignalR instant + pull-to-refresh fallback | ✓ |

**User's choice:** Both (SignalR + pull-to-refresh)

---

### Conflict resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Last write wins, silently | Duplicate operations silently ignored | ✓ |
| You decide | Claude picks | |

**User's choice:** Last write wins, silently

---

### Live hints for remote changes

| Option | Description | Selected |
|--------|-------------|----------|
| Task just appears | No extra notification, tasks slide in | |
| Brief highlight on new tasks | Color highlight that fades after 2-3s | |
| You decide | Claude picks what works with card layout | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## Claude's Discretion

- Real-time visual indicator for tasks from other family members
- Card styling details (shadow, border radius, spacing)
- Empty state design
- Swipe animation and confirmation
- Task name validation rules
- Error handling for failed operations

## Deferred Ideas

None — discussion stayed within phase scope
