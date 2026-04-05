# Phase 2: Messaging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 02-messaging
**Areas discussed:** Channel list design, Message display style, Real-time & persistence, Emoji reactions UX

---

## Channel List Design

| Option | Description | Selected |
|--------|-------------|----------|
| Simple list with names only | Clean list of channel names — tap to open. Minimal, like a folder view. | |
| List with last message preview | Channel name + snippet of last message + timestamp. Like iMessage/WhatsApp. | ✓ |
| You decide | Claude picks the best pattern. | |

**User's choice:** List with last message preview
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Floating action button (+) | FAB in bottom-right corner — tap to open a name input modal. | |
| Header button | Plus icon in the top-right navigation bar — opens a name input screen or modal. | ✓ |
| You decide | Claude picks the best UX pattern. | |

**User's choice:** Header button
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — auto-create General | Every family gets a #general channel on creation. Always exists, can't be deleted. | ✓ |
| No — start empty | Family starts with no channels. Members create what they need. | |
| You decide | Claude picks based on what works best for small families. | |

**User's choice:** Yes — auto-create General
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Bold channel name for unread | Simple bold text when there are unseen messages. No counts. | ✓ |
| No indicators (v1 simplicity) | No unread tracking in v1. MSG-10 is deferred to v2. | |
| You decide | Claude picks based on complexity vs value. | |

**User's choice:** Bold channel name for unread
**Notes:** None

---

## Message Display Style

| Option | Description | Selected |
|--------|-------------|----------|
| Chat bubbles | Colored bubbles — your messages right-aligned, others left-aligned. Classic messaging. | |
| Flat list with sender name | No bubbles. Each message is a row: sender name, text, timestamp. Like Slack/Discord. | ✓ |
| You decide | Claude picks. | |

**User's choice:** Flat list with sender name
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Inline with each message | Small timestamp next to or below every message. | ✓ |
| Date separators + relative time | Group by day with relative time on each message. | |
| You decide | Claude picks. | |

**User's choice:** Inline with each message
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Name above each message | Always show sender display name above their message. | |
| Name only on first in a group | Consecutive messages from same sender show name only on the first. | ✓ |
| You decide | Claude picks. | |

**User's choice:** Name only on first in a group
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Text only with send button | Simple text field + send button. Text-first for v1. | ✓ |
| Text + emoji keyboard shortcut | Text field + send + emoji button that opens system emoji picker. | |
| You decide | Claude picks. | |

**User's choice:** Text only with send button
**Notes:** None

---

## Real-time & Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Persist first, then broadcast | Message saves to Azure SQL first, then SignalR broadcasts. Reliable. | ✓ |
| Broadcast first, persist async | SignalR sends immediately, DB write in background. Faster but riskier. | |
| You decide | Claude picks. | |

**User's choice:** Persist first, then broadcast
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show immediately | Message appears instantly while API call happens in background. | ✓ |
| No — wait for server confirmation | Message only appears after successful API response. | |
| You decide | Claude picks. | |

**User's choice:** Yes — show immediately
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Load last 50, scroll up for more | Fetch most recent 50. Scrolling to top loads older messages. | |
| Load last 20, simple pagination | Smaller initial load. 'Load more' button at top. | |
| You decide | Claude picks the right batch size and loading pattern. | ✓ |

**User's choice:** You decide
**Notes:** Claude's discretion on batch size and loading pattern

---

## Emoji Reactions UX

| Option | Description | Selected |
|--------|-------------|----------|
| Long-press message | Long-press opens a reaction picker. Standard mobile pattern. | ✓ |
| Tap a reaction icon below message | Small reaction button always visible below each message. | |
| You decide | Claude picks. | |

**User's choice:** Long-press message
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Quick-pick row of 6 common emojis | Show common emojis in a floating row. Simple, fast. No full picker. | ✓ |
| Quick-pick row + full emoji keyboard | Quick picks plus button to open full system emoji keyboard. | |
| You decide | Claude picks. | |

**User's choice:** Quick-pick row of 6 common emojis
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Emoji chips with count | Small rounded pills below message: [👍 3] [❤️ 1]. Tap to toggle. | ✓ |
| Emoji chips with names on tap | Same pills, but tapping shows who reacted. | |
| You decide | Claude picks. | |

**User's choice:** Emoji chips with count
**Notes:** None

---

## Claude's Discretion

- Message history batch size and loading pattern
- Exact quick-pick emoji set for reactions
- Channel name validation rules
- Empty channel state
- Message grouping timing threshold
- Error states for failed sends
- SignalR connection management

## Deferred Ideas

None — discussion stayed within phase scope
