---
phase: 03-location
plan: "02"
subsystem: location
tags: [location, permissions, gps, messaging]
dependency_graph:
  requires: [03-01]
  provides: [location-permission-flow, gps-on-message-send]
  affects: [src/app/_layout.tsx, src/app/(tabs)/messages/[channelId].tsx]
tech_stack:
  added: []
  patterns:
    - SecureStore persistence for one-time modal state
    - Silent GPS capture with try/catch fallback before mutation
    - LocationPermissionModal with non-dismissible backdrop per UI-SPEC D-06
key_files:
  created:
    - src/hooks/useLocationPermission.ts
    - src/components/location/LocationPermissionModal.tsx
  modified:
    - src/app/_layout.tsx
    - src/app/(tabs)/messages/[channelId].tsx
decisions:
  - useLocationPermission checks getForegroundPermissionsAsync on mount to skip modal on reinstall (Pitfall 4)
  - GPS captured with Accuracy.Balanced (1-2s) before mutate — acceptable delay for family app
  - Modal only shown when session is truthy — ensures auth is complete before location prompt
metrics:
  duration: ~7min
  completed: "2026-04-06"
  tasks_completed: 2
  files_changed: 4
---

# Phase 3 Plan 02: Location Permission Flow and GPS Capture Summary

**One-liner:** Location permission modal with SecureStore-persisted one-time display and silent GPS coordinate capture on every message send.

## What Was Built

### Task 1: Location permission hook and modal component

**`src/hooks/useLocationPermission.ts`** — manages the one-time permission prompt lifecycle:
- On mount, checks `Location.getForegroundPermissionsAsync()` to detect existing system permission
- If `granted` or `denied`: marks as asked, skips modal (handles app reinstall correctly)
- If `undetermined` and not yet asked (checked via SecureStore key `location_permission_asked`): shows modal
- `requestPermission()` triggers the real system dialog via `requestForegroundPermissionsAsync()`
- `dismissModal()` marks as asked without requesting — "Not now" path
- Returns `{ ready, shouldShowModal, granted, requestPermission, dismissModal }`

**`src/components/location/LocationPermissionModal.tsx`** — centered modal per UI-SPEC D-06:
- `transparent={true}`, `animationType="fade"`
- Non-dismissible backdrop (no `onPress` on backdrop `View`)
- Icon: `Ionicons name="location"` at 48px in accent color
- Heading: "Stay in the loop"
- Body: "Your family can see where you last were when you send a message. You can turn this off anytime in your profile."
- Allow button: accent fill, "Allow location access"
- Not now button: text-only, textSecondary, "Not now"
- Both buttons have `accessibilityRole="button"`
- Content wrapped with `accessibilityViewIsModal={true}`

### Task 2: Wire into layout and message send

**`src/app/_layout.tsx`** — `RootNavigator` now:
- Calls `useLocationPermission()` for `shouldShowModal`, `requestPermission`, `dismissModal`
- Renders `<LocationPermissionModal>` after the `<Stack>` component
- Modal only renders when `session` is truthy (user authenticated, per D-07)

**`src/app/(tabs)/messages/[channelId].tsx`** — GPS capture wired into send flow:
- `handleSend` is now `async`
- Before calling `sendMutation.mutate()`, checks `getForegroundPermissionsAsync()`
- If granted, calls `getCurrentPositionAsync({ accuracy: Accuracy.Balanced })`
- Captures `{ latitude, longitude }` into `coords`
- On any error (permission denied, GPS failure, timeout): logs warning, `coords` stays `null`
- `sendMutation.mutationFn` updated to accept `{ text, coords }` payload, passes `coords` to `sendMessage()`
- `onError` parameter renamed from `_text` to `_vars` to match new payload shape

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `976a8c5` | feat(03-02): location permission hook and modal component |
| 2 | `9bca90c` | feat(03-02): wire permission modal into root layout + GPS capture on message send |

## Deviations from Plan

**1. [Rule 3 - Deviation] Worktree _layout.tsx uses Stack.Protected pattern**

- **Found during:** Task 2
- **Issue:** The worktree's `_layout.tsx` uses `Stack.Protected` (newer Expo Router v4 pattern) instead of the `useRouter/useSegments` redirect pattern shown in the plan's interface spec
- **Fix:** Wrapped Stack and LocationPermissionModal in a Fragment (`<>`) — same structural outcome, adapted to the existing navigation pattern
- **Files modified:** `src/app/_layout.tsx`
- **Commit:** `9bca90c`

## Known Stubs

None — location capture flows directly to `sendMessage()` which was wired in Plan 01 to send `latitude`/`longitude` to the backend.

## Threat Flags

No new threat surface introduced beyond what was documented in the plan's threat model.

## Self-Check: PASSED

Files verified:
- `src/hooks/useLocationPermission.ts` — exists, exports `useLocationPermission`
- `src/components/location/LocationPermissionModal.tsx` — exists, exports `LocationPermissionModal`
- `src/app/_layout.tsx` — imports and renders `LocationPermissionModal`
- `src/app/(tabs)/messages/[channelId].tsx` — imports `expo-location`, `handleSend` is async with GPS capture

Commits verified:
- `976a8c5` — feat(03-02): location permission hook and modal component
- `9bca90c` — feat(03-02): wire permission modal into root layout + GPS capture on message send
