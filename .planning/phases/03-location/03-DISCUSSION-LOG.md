# Phase 3: Location - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 03-location
**Areas discussed:** Location display, Permission flow, Capture behavior, Privacy controls

---

## Location Display

| Option | Description | Selected |
|--------|-------------|----------|
| Map pin + address | Small embedded map with pin + reverse-geocoded address. Familiar pattern (Find My). | :heavy_check_mark: |
| Address text only | No map — just address + relative time. Simpler, no map SDK. | |
| Coordinates + relative time | Raw lat/lng. Minimal effort but not user-friendly. | |

**User's choice:** Map pin + address
**Notes:** User selected the preview mockup showing member list with inline map expansion.

### Map Detail Location

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expand | Tapping expands a map card inline in the list. No navigation away. | :heavy_check_mark: |
| Full-screen modal | Opens full-screen map view. More immersive but heavier. | |
| Bottom sheet | Half-screen sheet with map. | |

**User's choice:** Inline expand

### Map Provider

| Option | Description | Selected |
|--------|-------------|----------|
| react-native-maps | Apple Maps on iOS, Google Maps on Android. Free, well-supported with Expo. | :heavy_check_mark: |
| Static map image | Fetch static image URL. No SDK dependency but non-interactive. | |
| You decide | Claude picks. | |

**User's choice:** react-native-maps

### Members Without Location

| Option | Description | Selected |
|--------|-------------|----------|
| Show with 'No location yet' | All members always visible. Placeholder for those without data. | :heavy_check_mark: |
| Hide until they have location | Only show members with at least one location. | |

**User's choice:** Show with 'No location yet'

### Staleness Indication

| Option | Description | Selected |
|--------|-------------|----------|
| Relative time + faded style | Show location but fade card and show time ago. | |
| Relative time only | Just show time ago, no visual fading. | |
| You decide | Claude picks best approach. | :heavy_check_mark: |

**User's choice:** You decide

---

## Permission Flow

### Pre-Permission Prompt Style

| Option | Description | Selected |
|--------|-------------|----------|
| Modal with illustration | Centered modal explaining location usage with Allow/Not now buttons. | :heavy_check_mark: |
| Inline banner | Dismissible banner above message input. Subtler. | |
| Full-screen onboarding card | Full-screen overlay. More prominent but heavy. | |

**User's choice:** Modal with illustration

### Denial Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Silent fallback | Messages send without location. No nagging. Enable later in settings. | :heavy_check_mark: (modified) |
| Gentle reminder | Small dismissible note on next message send. | |
| You decide | Claude picks. | |

**User's choice:** Silent fallback for messaging, BUT show a warning banner on the Location tab when sharing is off.
**Notes:** User specified the split behavior — no disruption in messaging flow, but visibility on the Location tab.

### Permission Timing

| Option | Description | Selected |
|--------|-------------|----------|
| On first message send | Show modal when user taps Send for first time. | |
| On first app open after Phase 3 | Proactively prompt when app opens. Gets it out of the way early. | :heavy_check_mark: |
| On first visit to Location tab | Prompt when visiting Location tab. Contextual but may never trigger. | |

**User's choice:** On first app open after Phase 3 ships
**Notes:** Diverges from LOC-04's wording ("when user first sends a message") — user prefers proactive approach.

---

## Capture Behavior

### Message Thread Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Silent — backend only | Location stored but not shown in chat thread. Only visible on Location tab. | |
| Subtle indicator | Small pin icon on messages with location. Tappable. | :heavy_check_mark: |
| You decide | Claude picks. | |

**User's choice:** Subtle indicator on messages

### Database Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Columns on messages table | Add lat/lng nullable columns to messages. Simple, location is message property. | |
| Separate locations table | Dedicated table. More flexible, decoupled from messages. | |
| You decide | Claude picks best schema. | :heavy_check_mark: |

**User's choice:** You decide

### GPS Precision

| Option | Description | Selected |
|--------|-------------|----------|
| Full precision | Exact coordinates. For private family app, appropriate. Reverse-geocode for display. | :heavy_check_mark: |
| Reduced precision | ~100m accuracy. Privacy buffer within family. | |
| You decide | Claude picks. | |

**User's choice:** Full precision

---

## Privacy Controls

### Opt-Out Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle on Profile screen | "Share location" toggle. When off, no location captured. Others see "Location sharing off." | :heavy_check_mark: |
| No opt-out — system permissions | Revoke via phone Settings. Simpler but less discoverable. | |
| You decide | Claude picks. | |

**User's choice:** Toggle on Profile screen

### Data Retention

| Option | Description | Selected |
|--------|-------------|----------|
| Keep indefinitely | Location stays with message forever. Tab shows most recent. No auto-expiry. | :heavy_check_mark: |
| Auto-expire after N days | Clear old location data. Reduces stored data but adds complexity. | |
| You decide | Claude picks. | |

**User's choice:** Keep indefinitely

---

## Claude's Discretion

- Database schema approach (messages columns vs separate table)
- Stale location visual treatment
- Reverse geocoding strategy
- Location pin icon design in messages
- Map card height and expand animation
- "No location yet" placeholder styling
- GPS failure error handling
- Family members API endpoint design

## Deferred Ideas

None — discussion stayed within phase scope
