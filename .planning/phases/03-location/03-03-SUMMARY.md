---
phase: 03-location
plan: "03"
subsystem: frontend-location-ui
tags: [location, ui, react-native-maps, reanimated, profile, messagebubble]
dependency_graph:
  requires: [03-01]
  provides: [location-tab-ui, profile-share-location-toggle, messagebubble-pin]
  affects: [src/app/(tabs)/location.tsx, src/app/(tabs)/profile.tsx, src/components/messages/MessageBubble.tsx]
tech_stack:
  added: [react-native-maps, expo-location (reverse geocode), react-native-reanimated]
  patterns: [TanStack Query useQuery/useMutation, Reanimated withTiming height animation, optimistic mutation with revert]
key_files:
  created:
    - src/components/location/MapCard.tsx
    - src/components/location/MemberLocationRow.tsx
    - src/components/location/LocationWarningBanner.tsx
  modified:
    - src/app/(tabs)/location.tsx
    - src/app/(tabs)/profile.tsx
    - src/components/messages/MessageBubble.tsx
decisions:
  - MapCard height animates 0->200px with Reanimated withTiming 250ms ease-out; content is always rendered, animation handles show/hide
  - MemberLocationRow stale location: opacity 0.6 for address+time when > 24h, full opacity otherwise
  - Profile toggle uses optimistic update (setShareLocation on onMutate) with revert on onError
  - MessageBubble pin uses lazy reverseGeocodeAsync — only fires on first tap, result cached in component state
  - react-native-maps and expo-location were listed in package.json but not installed; npm install added them
metrics:
  duration: 15min
  completed: "2026-04-06"
  tasks: 2
  files: 6
---

# Phase 3 Plan 03: Location UI — Member List, Map Expansion, Profile Toggle, Pin Icon Summary

Full location viewing experience: animated member list with inline MapCard expansion, warning banners, profile share-location toggle, and tappable pin icon on location-tagged messages.

## What Was Built

### Task 1 — Location Components (commit b8bcbff)

**MapCard** (`src/components/location/MapCard.tsx`)
- Reanimated `useSharedValue` + `withTiming(250ms)` animates height 0->200px on `expanded` prop change
- `react-native-maps` MapView with `PROVIDER_GOOGLE` on Android, Apple Maps on iOS
- `scrollEnabled={false}`, `zoomEnabled={false}` — display-only
- Pin uses `colors.accent`, shows address + "Last seen {timeAgo}" below map
- Exports `timeAgo` helper for reuse in MemberLocationRow

**MemberLocationRow** (`src/components/location/MemberLocationRow.tsx`)
- Avatar initial circle (40x40, accent background), display name, address/status line, time ago
- Three address states: "Location sharing off" / "No location yet" / actual address
- Stale location: `opacity: 0.6` for address+time when > 24h old
- `minHeight: 44` touch target, `accessibilityState={{ expanded }}`
- Chevron up/down shown only when member has location data
- MapCard rendered inline below row, always mounted, animation handles visibility

**LocationWarningBanner** (`src/components/location/LocationWarningBanner.tsx`)
- Two variants: `toggle-off` and `permission-denied`
- Tappable "profile" link uses `router.push('/(tabs)/profile')`
- Tappable "Settings" link uses `Linking.openSettings()`

### Task 2 — Screens and MessageBubble (commit 162bf7b)

**Location tab** (`src/app/(tabs)/location.tsx`)
- Replaced placeholder with FlatList of MemberLocationRow components
- `expandedUserId` state — only one member expanded at a time (toggle behavior)
- LocationWarningBanner: toggle-off banner takes priority over permission-denied
- Permission status checked via `Location.getForegroundPermissionsAsync()` on mount
- Pull-to-refresh via RefreshControl, loading spinner, error state with exact UI-SPEC copy
- Screen title "Family locations" set via `navigation.setOptions`

**Profile screen** (`src/app/(tabs)/profile.tsx`)
- Added PRIVACY section header (uppercase, textSecondary, Typography.label weight 600)
- Share location Switch with optimistic mutation — `onMutate` sets state, `onError` reverts
- Toggle sub-label: "Family can see where you last were when you send a message"
- Reuses `memberLocations` query key so Location tab stays in sync after toggle

**MessageBubble** (`src/components/messages/MessageBubble.tsx`)
- Ionicons `location` at size 12, `textSecondary` color, inline after message text
- Rendered only when `message.latitude != null`
- Pin tap: lazy `reverseGeocodeAsync` (only on first tap, cached in `useState`)
- Modal with "Sent from" title, address, and formatted time; dismissed by backdrop tap

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] react-native-maps and expo-location not installed**
- **Found during:** Task 1 TypeScript check
- **Issue:** Both packages were in package.json but missing from node_modules, causing TS2307 module-not-found errors
- **Fix:** Ran `npm install` which added both packages
- **Files modified:** package-lock.json (node_modules)
- **Commit:** b8bcbff (included in task commit)

## Known Stubs

None — all components are fully wired to live data via TanStack Query and the API client from Plan 01.

## Threat Flags

No new network endpoints or auth paths introduced. All location data flows through existing `/locations/family/:familyId/members` endpoint (T-3-02 mitigated by backend familyId enforcement from Plan 01). Share location toggle uses existing `/users/me` PATCH endpoint. No new trust boundaries introduced.

## Self-Check: PASSED

Files exist:
- src/components/location/MapCard.tsx — FOUND
- src/components/location/MemberLocationRow.tsx — FOUND
- src/components/location/LocationWarningBanner.tsx — FOUND
- src/app/(tabs)/location.tsx — FOUND (rewritten)
- src/app/(tabs)/profile.tsx — FOUND (modified)
- src/components/messages/MessageBubble.tsx — FOUND (modified)

Commits:
- b8bcbff — feat(03-03): location components
- 162bf7b — feat(03-03): location tab screen, profile toggle, MessageBubble pin icon
