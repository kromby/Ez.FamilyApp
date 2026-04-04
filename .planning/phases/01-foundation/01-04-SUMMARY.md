---
phase: 01-foundation
plan: 04
subsystem: navigation
tags: [expo-router, react-native, tabs, ionicons, navigation, dark-mode, session]

# Dependency graph
requires:
  - 01-02 (SessionProvider, useSession, useThemeColors, design tokens)
provides:
  - 5-tab navigation shell (Home, Messages, Tasks, Location, Profile)
  - NAV-01: tab-based navigation
  - NAV-02: family name visible in app header
affects:
  - src/app/_layout.tsx (references (tabs) group — now has content)

# Tech stack
added: []
patterns:
  - Expo Router Tabs composition for tab navigation
  - useNavigation().setOptions() for dynamic header title from session data
  - useThemeColors() hook for dark-mode-aware StyleSheet styles
  - getInitials() helper for avatar display from displayName

# Key files
created:
  - src/app/(tabs)/_layout.tsx
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/messages.tsx
  - src/app/(tabs)/tasks.tsx
  - src/app/(tabs)/location.tsx
  - src/app/(tabs)/profile.tsx
modified: []

# Decisions
- Dynamic header title uses navigation.setOptions({ title: user?.familyName ?? 'Home' }) inside useEffect — cleanest Expo Router pattern for per-screen header overrides
- Phase 1 Home tab shows only current user's avatar (single avatar); multi-member list deferred to Phase 2 when member list API is available
- marginTop: 'auto' used on Sign Out button to push to bottom of flex container

# Metrics
duration: 2min
completed: 2026-04-03
tasks_completed: 2
files_created: 6
files_modified: 0
---

# Phase 01 Plan 04: Tab Navigation Shell Summary

**One-liner:** 5-tab Expo Router shell with Ionicons active/inactive icons, family name header via session, dark-mode styling, and profile sign-out confirmation alert.

## What Was Built

The complete tab navigation shell for authenticated users. After this plan, users who complete onboarding land in a fully functional 5-tab app with:

- **Home tab**: family name in the navigation header (NAV-02), member avatar row showing current user's initials, recent activity empty state with correct UI-SPEC.md copy
- **Messages, Tasks, Location tabs**: centered empty states with 48pt Ionicons, headings, and body copy matching UI-SPEC.md copywriting contract exactly
- **Profile tab**: read-only display name and family name rows, Sign Out button with Alert confirmation using exact copy from UI-SPEC.md destructive actions contract

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 22b9891 | feat(01-04): tab bar layout with 5-tab Ionicons config |
| Task 2 | fead8c6 | feat(01-04): all five tab screen implementations |

## Acceptance Criteria

- [x] 5 Tabs.Screen entries (Home, Messages, Tasks, Location, Profile) in order
- [x] Active tab uses filled Ionicons variant in `colors.accent`; inactive uses outline in `colors.textSecondary`
- [x] Home tab header title = `user?.familyName ?? 'Home'` (NAV-02)
- [x] Home tab shows member avatar circles (initials, 40pt, accent background)
- [x] Messages empty state: `chatbubbles-outline` icon + "No messages yet" heading
- [x] Tasks empty state: `checkmark-circle-outline` icon + "No tasks yet" heading
- [x] Location empty state: `location-outline` icon + "No location data yet" heading
- [x] Profile shows display name + family name read-only rows
- [x] Profile Sign Out shows `Alert.alert('Sign Out?', "You'll need your family code to rejoin.", ...)`
- [x] All 6 files dark-mode aware via `useThemeColors()`

## Deviations from Plan

None - plan executed exactly as written.

The only minor adaptation: the plan's file paths used `app/(tabs)/` but the project convention (established in plan 01-02) is `src/app/(tabs)/`. All files were created at the correct `src/app/(tabs)/` location consistent with Expo SDK 55 `src/` directory convention.

## Known Stubs

- Home tab member avatar row shows only the current user's own avatar. The `user` object from `useSession()` does not include a full family member list. The member list requires a Phase 2 API endpoint (`GET /families/:id/members`) and will be wired in a future plan. This stub does not prevent the plan's navigation goal (NAV-01, NAV-02) from being achieved.

## Self-Check: PASSED

All 6 tab files exist at `src/app/(tabs)/`. Both task commits (22b9891, fead8c6) confirmed in git log. SUMMARY.md written successfully.
