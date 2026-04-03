# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 01-foundation
**Areas discussed:** Onboarding flow, App shell & tabs

---

## Onboarding Flow

### First Screen
| Option | Description | Selected |
|--------|-------------|----------|
| Create or Join | Two buttons: 'Create a family' and 'Join a family' | |
| Single entry | One screen: enter code or tap 'create new' | |
| You decide | Claude picks the best UX pattern | ✓ |

**User's choice:** You decide — Claude's discretion
**Notes:** None

### Identity (New User Info)
| Option | Description | Selected |
|--------|-------------|----------|
| Display name only | Just a name, no email, no password | |
| Name + email | Display name plus email for account recovery | ✓ |
| Name + email + password | Traditional signup with credentials | |

**User's choice:** Name + email
**Notes:** Email for account recovery, not for login verification

### Creator Flow
| Option | Description | Selected |
|--------|-------------|----------|
| Family name only | Just name the family, code is auto-generated | ✓ |
| Name + settings | Family name plus initial setup (default channels, etc.) | |

**User's choice:** Family name only
**Notes:** None

### Join Flow
| Option | Description | Selected |
|--------|-------------|----------|
| Instant join | Enter code, you're in immediately | ✓ |
| Approval needed | Enter code, creator approves first | |

**User's choice:** Instant join
**Notes:** None

---

## App Shell & Tabs

### Tab Order
| Option | Description | Selected |
|--------|-------------|----------|
| Messages first | Messages, Tasks, Location, Profile | |
| Home hub | Home (family overview), Messages, Tasks, Location, Profile | ✓ |
| You decide | Claude picks | |

**User's choice:** Home hub — 5 tabs with Home as the family overview
**Notes:** None

### Default Tab
| Option | Description | Selected |
|--------|-------------|----------|
| Messages | Most-used feature front and center | |
| Home/overview | Dashboard showing recent activity | ✓ |
| Last used | Returns to last open tab | |

**User's choice:** Home/overview
**Notes:** None

### Empty States
| Option | Description | Selected |
|--------|-------------|----------|
| Coming soon | Simple placeholder with icon | |
| You decide | Claude picks appropriate empty states | ✓ |

**User's choice:** You decide — Claude's discretion
**Notes:** None

---

## Claude's Discretion

- First screen layout (create vs join UX)
- Empty tab states for unbuilt features
- Auth strategy on Azure
- Family code format and error handling

## Deferred Ideas

None
