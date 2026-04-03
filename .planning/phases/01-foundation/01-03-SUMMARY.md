---
phase: 01-foundation
plan: 03
subsystem: auth
tags: [expo, react-native, auth-screens, onboarding, api-client, expo-router, expo-clipboard]

# Dependency graph
requires:
  - 01-02 (session store, design tokens, root layout with Stack.Protected)
provides:
  - Typed API client (src/api/client.ts) with all five auth/onboarding functions
  - Auth group Stack layout (src/app/(auth)/_layout.tsx)
  - Welcome screen with create/join entry points
  - Create Family flow: family name + email → OTP → display name → share code
  - Join Family flow: 8-char code + email → OTP → display name → signIn
  - Full onboarding complete: signIn() called at flow end triggers Stack.Protected redirect
affects: [tab-screens, session-store]

# Tech tracking
tech-stack:
  added:
    - expo-clipboard ~55.0.11 (family code copy-to-clipboard on share-code screen)
  patterns:
    - Flow state passed via router params (Expo Router file-based routing constraint)
    - createStyles(colors) pattern per-screen — no hardcoded hex in StyleSheet
    - useThemeColors() in every screen for dark mode awareness
    - ActivityIndicator replaces button label during async operations (button disabled)
    - Stack.Protected handles auth→tabs routing — no manual router.push to (tabs) from screens

key-files:
  created:
    - src/api/client.ts
    - src/app/(auth)/_layout.tsx
    - src/app/(auth)/welcome.tsx
    - src/app/(auth)/create-family.tsx
    - src/app/(auth)/join-family.tsx
    - src/app/(auth)/verify-otp.tsx
    - src/app/(auth)/set-name.tsx
    - src/app/(auth)/share-code.tsx
  modified:
    - package.json (expo-clipboard added)

key-decisions:
  - "Files placed at src/app/(auth)/ matching Expo SDK 55 src/app/ convention from plan 01-02 (plan referenced app/(auth)/ but correct path is src/app/(auth)/)"
  - "set-name passes token+userId+displayName+familyId params to share-code so Continue to App can call signIn() without an extra network call"
  - "expo-clipboard used for Copy Code on share-code screen (install via npx expo install)"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 01 Plan 03: Auth Screens and API Client Summary

**Six onboarding screens and a typed API client completing full create-family and join-family flows with OTP verification, display name setup, and signIn() call**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T23:29:35Z
- **Completed:** 2026-04-03T23:32:21Z
- **Tasks:** 2
- **Files modified:** 8 (+ package.json/package-lock.json for expo-clipboard)

## Accomplishments

- Typed API client wrapping all five backend endpoints with plain `fetch` — no external HTTP library
- Auth group Stack layout with `headerShown: false` suppressing headers across all auth screens
- All six screens match UI-SPEC.md layout patterns: KeyboardAvoidingView, 64pt top padding, 52pt primary CTA buttons, 48pt inputs (56pt for code field)
- Error messages match UI-SPEC.md copywriting contract exactly
- ActivityIndicator loading states on all screens with async operations (create-family, join-family, verify-otp, set-name, share-code)
- Family code displayed at 28pt semibold, accent color, letterSpacing: 4 per spec
- Copy Code uses expo-clipboard, Continue to App calls signIn() — no extra network call needed
- No hardcoded hex values in any StyleSheet — all reference colors.accent, colors.border, etc.

## Task Commits

Each task was committed atomically:

1. **Task 1: API client and auth group layout** — `8245b3b` (feat)
2. **Task 2: All six auth/onboarding screens** — `776c890` (feat)

## Files Created/Modified

- `src/api/client.ts` — Typed fetch wrappers: requestOtp, verifyOtp, createFamily, joinFamily, setDisplayName
- `src/app/(auth)/_layout.tsx` — Auth group Stack, headerShown: false
- `src/app/(auth)/welcome.tsx` — Landing screen with Create a Family (accent fill) + Join a Family (outlined) buttons
- `src/app/(auth)/create-family.tsx` — Family name + email inputs → requestOtp → navigate to verify-otp
- `src/app/(auth)/join-family.tsx` — 8-char code (56pt, autoCapitalize="characters", maxLength=8) + email → requestOtp
- `src/app/(auth)/verify-otp.tsx` — 6-digit OTP → verifyOtp → createFamily or joinFamily branch → navigate to set-name
- `src/app/(auth)/set-name.tsx` — Display name → setDisplayName → router.replace to share-code (create) or signIn() (join)
- `src/app/(auth)/share-code.tsx` — Family code display → Copy Code (expo-clipboard) → Continue to App (signIn())
- `package.json` — Added expo-clipboard ~55.0.11

## Decisions Made

- Files placed at `src/app/(auth)/` — plan referenced `app/(auth)/` conceptually but the project uses `src/app/` as established in plan 01-02
- `set-name` passes `token`, `userId`, `displayName`, `familyId` params to `share-code` so the Continue button can call `signIn()` without an extra API call
- `expo-clipboard` installed via `npx expo install` for the Copy Code action on share-code screen

## Deviations from Plan

None — plan executed exactly as written. The only path adjustment was `src/app/(auth)/` vs `app/(auth)/`, which matches the convention established in plan 01-02.

## Known Stubs

None. All screens are fully wired to the API client and session store.

---
*Phase: 01-foundation*
*Completed: 2026-04-03*

## Self-Check: PASSED

- FOUND: src/api/client.ts
- FOUND: src/app/(auth)/_layout.tsx
- FOUND: src/app/(auth)/welcome.tsx
- FOUND: src/app/(auth)/create-family.tsx
- FOUND: src/app/(auth)/join-family.tsx
- FOUND: src/app/(auth)/verify-otp.tsx
- FOUND: src/app/(auth)/set-name.tsx
- FOUND: src/app/(auth)/share-code.tsx
