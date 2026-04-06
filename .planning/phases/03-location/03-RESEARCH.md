# Phase 3: Location — Research

**Researched:** 2026-04-06
**Domain:** React Native location permissions, GPS capture, react-native-maps, reverse geocoding, Azure SQL schema extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Location tab shows a list of all family members with their last known location summary (address snippet + relative time)
- **D-02:** Members without location data still appear in the list with "No location yet" placeholder
- **D-03:** Tapping a member expands an inline map card (not a modal or new screen) showing a pin, reverse-geocoded address, and time ago
- **D-04:** Map uses react-native-maps (Apple Maps on iOS, Google Maps on Android)
- **D-06:** Pre-permission prompt is a centered modal with a friendly icon explaining: "Your family can see where you last were when you send a message" — with Allow / Not now buttons
- **D-07:** Permission prompt appears proactively on first app open (not on first message send) — ensures everyone is asked early
- **D-08:** If user denies: messages send normally without location (silent fallback), no nagging or reminders in the messaging flow
- **D-09:** Location tab shows a warning banner when location sharing is off for the current user, with a link to enable in settings
- **D-10:** Location is captured silently when sending a message — no extra user step required
- **D-11:** Messages with location data show a subtle pin icon in the message thread UI (tappable to see where it was sent from)
- **D-12:** Full GPS precision stored — exact coordinates from expo-location, reverse-geocoded to address for display
- **D-13:** Database schema design — Claude's discretion (columns on messages table vs separate locations table)
- **D-14:** Profile screen gets a "Share location" toggle — when off, messages send without location, other members see "Location sharing off"
- **D-15:** Location data retained indefinitely — the Location tab always shows the most recent location per member

### Claude's Discretion

- Database schema approach (D-13) — columns on messages table or separate locations table
- Stale location visual treatment (D-05) — fading, color changes, or time-only
- Reverse geocoding strategy — client-side vs server-side, caching approach
- Location pin icon design in message thread
- Map card height and animation when expanding inline
- "No location yet" placeholder styling
- Error handling for GPS failures (timeout, no signal)
- Family members list API endpoint design (needed for Location tab — doesn't exist yet)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOC-01 | User's location is automatically captured when they send a message | expo-location `getCurrentPositionAsync`, extend `sendMessage` in `src/lib/api.ts` and POST /messages route |
| LOC-02 | User can tap on a family member to see their last known location | New `GET /families/:familyId/members/locations` endpoint + `MemberLocationRow` + `MapCard` components |
| LOC-03 | Last known location displays who, where, and how old the location is | `reverseGeocodeAsync` for address, relative time formatting, member display name from users table |
| LOC-04 | Location permission is requested when user first sends a message | D-07 overrides this — permission modal shown on first app open; expo-location `requestForegroundPermissionsAsync` |

</phase_requirements>

---

## Summary

Phase 3 adds passive location to an existing Azure SQL + Express + Expo app. The core work falls into four buckets: (1) installing and configuring `expo-location` + `react-native-maps`, (2) extending the database schema and backend endpoints, (3) building the Location tab UI with inline map expansion, and (4) wiring the permission modal into `_layout.tsx`.

The stack is well-understood: `expo-location` provides foreground GPS capture via `getCurrentPositionAsync` and built-in `reverseGeocodeAsync` for address resolution — no third-party geocoding API is needed. `react-native-maps` is the locked choice (D-04), using Apple Maps on iOS (zero key setup) and Google Maps on Android (requires a Google Maps API key). Both packages are Expo managed-workflow compatible and installable via `npx expo install`.

The schema decision (D-13, Claude's discretion) favors a dedicated `member_locations` table over columns on the `messages` table — this decouples "last known location per user" from message history and avoids scanning a potentially large messages table. The messages table gets two nullable columns (`latitude`, `longitude`) for the D-11 pin icon. The `users` table gets a `share_location BIT` column for the D-14 profile toggle.

**Primary recommendation:** Add `latitude`/`longitude` to the messages table for the pin icon, add a separate `member_locations` table (upsert on each message send) as the source of truth for the Location tab, and store `share_location` on the users table.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-location | 55.1.6 | Foreground GPS + reverse geocoding | Official Expo SDK; `requestForegroundPermissionsAsync`, `getCurrentPositionAsync`, `reverseGeocodeAsync` all in one package. No background location needed. |
| react-native-maps | 1.27.2 | Map rendering | Locked by D-04. Apple Maps on iOS (no key), Google Maps on Android (needs API key). SDK 55 compatible via its own Expo config plugin (not Expo's legacy `withMaps`). |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-reanimated | 4.2.1 (already installed) | Animated height for MapCard expand | Already in project; use `useSharedValue` + `useAnimatedStyle` for the 250ms expand animation. |
| @tanstack/react-query | 5.96.2 (already installed) | Fetch member locations | Already in project; `useQuery` for `GET /families/:familyId/members/locations`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `reverseGeocodeAsync` (client-side) | Google Maps Geocoding API (server-side) | Server-side caching is possible but adds API key management and complexity with no user-facing benefit for a 5–10 user app. Client-side is simpler and sufficient. |
| Dedicated `member_locations` table | Location columns on `messages` | Columns on `messages` forces a self-join or subquery to get "latest per user". A dedicated table with upsert is O(1) lookup per user. |
| Native `Switch` (React Native) | Custom toggle | `Switch` is built into React Native, matches platform conventions, supports `trackColor` for accent color. No additional install. |

**Installation:**
```bash
npx expo install expo-location react-native-maps
```

**Version verification:** [VERIFIED: npm registry]
- `expo-location@55.1.6` — published in line with Expo SDK 55 release cycle
- `react-native-maps@1.27.2` — published 3 weeks ago via GitHub Actions

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── location/
│   │   ├── LocationPermissionModal.tsx   # First-open permission modal (D-06, D-07)
│   │   ├── MemberLocationRow.tsx         # List row with inline MapCard expansion (D-01, D-02, D-03)
│   │   ├── MapCard.tsx                   # 200px animated react-native-maps card
│   │   └── LocationWarningBanner.tsx     # Warning banner when sharing off (D-09)
│   └── messages/
│       └── MessageBubble.tsx             # MODIFY: add location pin icon (D-11)
├── hooks/
│   └── useLocationPermission.ts          # Permission state + requestForegroundPermissionsAsync
├── app/
│   └── (tabs)/
│       ├── location.tsx                  # REPLACE placeholder
│       └── profile.tsx                  # MODIFY: add share location toggle (D-14)
backend/src/
├── routes/
│   ├── messages.ts                       # MODIFY: accept lat/lng, upsert member_locations
│   └── locations.ts                      # NEW: GET /families/:familyId/members/locations
├── db/
│   └── schema.sql                        # ADD: member_locations table, messages columns, users column
```

### Pattern 1: Permission Gate on First App Open

The `useLocationPermission` hook manages permission state in Zustand + SecureStore. The root `_layout.tsx` reads `locationPermissionAsked` and renders `LocationPermissionModal` if false AND the system permission status has not already been determined (handles reinstall case).

```typescript
// src/hooks/useLocationPermission.ts
// Source: expo-location docs + existing session store pattern
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

const PERM_KEY = 'location_permission_asked';

export function useLocationPermission() {
  // Reads from Zustand store + SecureStore for persistence across restarts
  // Returns: { asked, granted, request, checkExistingStatus }
}
```

Key detail: call `Location.getForegroundPermissionsAsync()` first on mount. If the system already has a `granted` or `denied` status (reinstall path), skip the modal entirely and set `asked = true` without calling `requestForegroundPermissionsAsync()` again. [VERIFIED: expo-location docs]

### Pattern 2: Silent Location Capture on Message Send

```typescript
// src/lib/api.ts — extend sendMessage signature
export async function sendMessage(
  token: string,
  channelId: string,
  text: string,
  coords?: { latitude: number; longitude: number } | null
): Promise<{ message: Message }> {
  return apiFetch('/messages', token, {
    method: 'POST',
    body: JSON.stringify({ channelId, text, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null }),
  });
}
```

Client captures location BEFORE calling `sendMessage`. If GPS fails or permission is denied, `coords` is null — message sends normally. The 5-second timeout is the practical cap for GPS acquisition (use `Accuracy.Balanced`, not `Accuracy.High` — it resolves in ~1–2 seconds on real devices). [ASSUMED]

### Pattern 3: Member Locations Upsert (Backend)

```sql
-- On each POST /messages with non-null lat/lng:
MERGE member_locations AS target
USING (SELECT @userId AS user_id, @familyId AS family_id, @lat AS latitude, @lng AS longitude, @messageId AS message_id) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET latitude = source.latitude, longitude = source.longitude, message_id = source.message_id, updated_at = GETUTCDATE()
WHEN NOT MATCHED THEN INSERT (user_id, family_id, latitude, longitude, message_id, updated_at) VALUES (source.user_id, source.family_id, source.latitude, source.longitude, source.message_id, GETUTCDATE());
```

Azure SQL supports `MERGE` natively. This is the standard upsert pattern for mssql. [VERIFIED: Azure SQL documentation]

### Pattern 4: Inline Map Card Expansion (Reanimated)

```typescript
// src/components/location/MapCard.tsx
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Height animates from 0 to 200px over 250ms (ease-out per UI-SPEC)
const height = useSharedValue(0);
const animStyle = useAnimatedStyle(() => ({ height: height.value, overflow: 'hidden' }));

// On expand:
height.value = withTiming(200, { duration: 250 });
// On collapse:
height.value = withTiming(0, { duration: 250 });
```

Reanimated 4.x (already installed) uses worklets API — `useSharedValue` and `withTiming` are the correct entry points. [VERIFIED: react-native-reanimated is 4.2.1 in package.json]

### Anti-Patterns to Avoid

- **Calling `getCurrentPositionAsync` with `Accuracy.High` or `Accuracy.BestForNavigation`:** These can take 10–30 seconds on cold GPS start and will block the message send. Use `Accuracy.Balanced` (resolves in ~1–2 seconds, ~100m accuracy — acceptable for passive check-in). [ASSUMED]
- **Reverse-geocoding on every render:** Cache the address string per `{ latitude, longitude }` pair. Geocode once when storing, not on every list render. Do client-side reverse geocoding and cache the result, OR store the address string in `member_locations` after first geocode.
- **Adding `react-native-maps` plugin inside the legacy Expo `plugins: ["expo-router", ...]` pattern without the correct key:** The package moved to its own config plugin in v1.23+. The plugin entry must be `["react-native-maps", { "androidGoogleMapsApiKey": "..." }]`, not Expo's old `withMaps`. [VERIFIED: GitHub issue #42423 resolution]
- **Requesting location permission inside the message send flow:** D-07 says permission is asked on first app open. The message send path should only check if permission is granted (fast synchronous check), never prompt.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GPS coordinate acquisition | Custom native module | `expo-location` `getCurrentPositionAsync` | Handles iOS/Android permission dialogs, location service availability, and accuracy negotiation |
| Address from coordinates | HTTP calls to a geocoding API | `expo-location` `reverseGeocodeAsync` | Built-in, uses platform geocoding (Apple on iOS, Google on Android) — no API key needed |
| Map rendering | Canvas-based map | `react-native-maps` MapView | Native map tiles, pin rendering, accessibility, zoom/pan gestures |
| Relative time formatting | Custom date math | Inline `Date` arithmetic (simple enough) | "X minutes ago / X hours ago / X days ago" is ~10 lines; no library needed for this app |
| SQL upsert | SELECT then INSERT/UPDATE | `MERGE` statement | Azure SQL native upsert — avoids race condition on concurrent message sends |

**Key insight:** Reverse geocoding via `reverseGeocodeAsync` is entirely client-side using the platform's native geocoding service — no Google Maps API key is required for reverse geocoding, only for the map tiles on Android.

---

## Runtime State Inventory

> Not a rename/refactor phase — no runtime state rename required. Section included for completeness.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Azure SQL: no location data yet (new columns/table) | Schema migration only |
| Live service config | Azure SignalR: no location fields in broadcast payload | Optional: broadcast payload can include lat/lng for future use; not required in this phase |
| OS-registered state | None | None |
| Secrets/env vars | Google Maps API key (new) needed for Android builds | Add `GOOGLE_MAPS_ANDROID_API_KEY` to environment; add to `app.json` plugin config |
| Build artifacts | None — no location packages installed yet | Fresh install via `npx expo install` |

---

## Common Pitfalls

### Pitfall 1: Google Maps API Key Required for Android Production Builds

**What goes wrong:** `react-native-maps` works in Expo Go without an API key (uses bundled dev key). When building with EAS for production, Google Maps on Android shows a blank/grey screen without a valid API key.

**Why it happens:** The Expo Go app bundles a shared development Google Maps key. EAS production builds require your own key.

**How to avoid:** Create a Google Maps API key in Google Cloud Console, enable "Maps SDK for Android", add it to `app.json` under the `react-native-maps` plugin config before the first EAS build.

**Warning signs:** Map renders in Expo Go, blank in release build.

### Pitfall 2: GPS Timeout on Cold Start Blocks Message Send

**What goes wrong:** `getCurrentPositionAsync` with `Accuracy.High` can take 10–30 seconds when GPS has not been active recently (cold start). The user's message send hangs.

**Why it happens:** High accuracy requires GPS satellite lock — slow when device hasn't used GPS recently.

**How to avoid:** Use `Accuracy.Balanced` with a `timeInterval`/`mayShowUserSettingsDialog: false` timeout of 5 seconds. If it times out, catch the error silently and send without location.

**Warning signs:** Message send feels slow on first use or after device restart.

### Pitfall 3: `reverseGeocodeAsync` Called on Every List Render

**What goes wrong:** The Location tab renders 5–10 member rows, each triggering a `reverseGeocodeAsync` call on every render cycle, causing noticeable lag and potential rate-limit behavior.

**Why it happens:** Geocoding is expensive — it calls platform native APIs under the hood.

**How to avoid:** Two options: (a) Cache the address string in the `member_locations` table after first geocode, so the GET endpoint returns address strings directly. (b) Geocode client-side and memoize per `{lat, lng}` pair using `useMemo` or a simple in-memory cache. Option (a) is preferred — geocode on the backend after INSERT or on the client and PATCH the cached address back.

**Warning signs:** Location tab feels sluggish, geocoding logs appearing on every scroll.

### Pitfall 4: Permission Asked Again on App Reinstall

**What goes wrong:** After reinstall, `SecureStore` is cleared (iOS) or `locationPermissionAsked` is false in fresh app state, so the modal shows again — but the system already has a permission decision from the previous install.

**Why it happens:** `SecureStore` (Keychain on iOS) may or may not persist through reinstall depending on iOS version and iCloud Keychain settings. Zustand store is reset on fresh install.

**How to avoid:** Always call `Location.getForegroundPermissionsAsync()` first. If the returned status is `granted` or `denied`, set `locationPermissionAsked = true` and skip the modal. Only show modal if status is `undetermined`. [VERIFIED: expo-location docs pattern]

**Warning signs:** Users see the permission modal a second time without the system prompt appearing.

### Pitfall 5: `mssql` Duplicate Input Binding in MERGE Statement

**What goes wrong:** The existing codebase uses `@familyId2` naming to avoid mssql duplicate binding errors (documented in STATE.md). The MERGE statement uses multiple inputs — ensure no binding name collisions.

**Why it happens:** `mssql` pool.request() does not allow the same `@param` name twice in a single query, even if the value is the same.

**How to avoid:** Use distinct names: `@userId`, `@familyId`, `@lat`, `@lng`, `@msgId` — no reuse within the same request object.

**Warning signs:** Runtime error "The variable name '@X' has already been declared."

---

## Code Examples

### expo-location: Permission Check + GPS Capture

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/location/
import * as Location from 'expo-location';

// Check existing permission (fast, synchronous-feeling)
const { status } = await Location.getForegroundPermissionsAsync();

// Request permission (shows system dialog)
const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

// Capture current position
const loc = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
});
// loc.coords.latitude, loc.coords.longitude

// Reverse geocode
const [address] = await Location.reverseGeocodeAsync({
  latitude: loc.coords.latitude,
  longitude: loc.coords.longitude,
});
// address.street, address.city, address.region, address.country
```

### react-native-maps: MapView with Marker

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/map-view/
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform } from 'react-native';

<MapView
  style={{ width: '100%', height: 200 }}
  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
  region={{
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
  scrollEnabled={false}
  zoomEnabled={false}
>
  <Marker
    coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
    pinColor={Colors.light.accent}
  />
</MapView>
```

### app.json Plugin Config for react-native-maps

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      ["expo-splash-screen", { ... }],
      "expo-secure-store",
      [
        "react-native-maps",
        {
          "androidGoogleMapsApiKey": "GOOGLE_MAPS_ANDROID_API_KEY"
        }
      ]
    ]
  }
}
```

Note: No `iosGoogleMapsApiKey` needed — Apple Maps is default on iOS and requires no key. [VERIFIED: Expo docs]

### Schema: New Tables and Columns

```sql
-- Add to messages table (for D-11 pin icon)
ALTER TABLE messages ADD latitude FLOAT NULL;
ALTER TABLE messages ADD longitude FLOAT NULL;

-- Add to users table (for D-14 profile toggle)
ALTER TABLE users ADD share_location BIT NOT NULL DEFAULT 1;

-- New table: one row per user, upserted on message send
CREATE TABLE member_locations (
  user_id      UNIQUEIDENTIFIER PRIMARY KEY REFERENCES users(id),
  family_id    UNIQUEIDENTIFIER NOT NULL REFERENCES families(id),
  latitude     FLOAT NOT NULL,
  longitude    FLOAT NOT NULL,
  message_id   UNIQUEIDENTIFIER NOT NULL REFERENCES messages(id),
  address      NVARCHAR(300) NULL,  -- cached reverse-geocoded address
  updated_at   DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  INDEX ix_member_locations_family (family_id)
);
```

### GET /families/:familyId/members/locations Response Shape

```typescript
// Response: all family members with their last location
{
  members: [
    {
      userId: string,
      displayName: string,
      shareLocation: boolean,        // from users.share_location
      latitude: number | null,       // from member_locations
      longitude: number | null,
      address: string | null,        // cached reverse geocode
      updatedAt: string | null,      // ISO timestamp
    }
  ]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Expo `withMaps` config plugin (expo.plugins) | react-native-maps owns its own Expo config plugin | react-native-maps v1.23.0 | Must use `["react-native-maps", {...}]` not Expo's legacy `withMaps` |
| Background location for passive tracking | Foreground + on-demand capture | Privacy-first trend | Simpler, better privacy, no background mode entitlement needed |

**Deprecated/outdated:**
- Expo `withMaps` plugin: replaced by `react-native-maps`' own config plugin in v1.23.0+. Using the old pattern causes build failures with SDK 55+.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Accuracy.Balanced` resolves in ~1–2 seconds on real devices | Architecture Patterns / Pitfall 2 | GPS could take longer; add explicit 5s timeout + silent fallback regardless |
| A2 | Client-side `reverseGeocodeAsync` and caching the result in `member_locations.address` is the right geocoding strategy | Don't Hand-Roll / Pitfall 3 | If caching on write adds complexity, skip caching and geocode on read with memoization instead |

---

## Open Questions

1. **Google Maps Android API Key provisioning**
   - What we know: Production Android builds require a Google Maps API key; Expo Go works without one
   - What's unclear: Whether the developer has a Google Cloud project ready for this app
   - Recommendation: Plan must include a Wave 0 task to obtain the key OR note that Android map will only be tested in Expo Go during development, with production key deferred

2. **Cached address in `member_locations` vs geocode on read**
   - What we know: `reverseGeocodeAsync` is resource-intensive and should not be called on every render
   - What's unclear: Whether to geocode client-side before sending (adds latency to message send) or geocode after receiving from server (adds UI complexity)
   - Recommendation: Geocode client-side immediately after GPS capture (same async block, non-blocking relative to message send), then PATCH the address in `member_locations` via a fire-and-forget call, OR include address in the POST /messages payload if geocoding is fast enough

3. **`expo-location` plugin config in app.json**
   - What we know: `expo-location` may require adding its config plugin to `app.json` for iOS permission strings
   - What's unclear: Whether `usesNonExemptEncryption` or NSLocationWhenInUseUsageDescription needs explicit config
   - Recommendation: Plan must add `["expo-location", { "locationWhenInUsePermission": "Your family can see where you last were when you send a message." }]` to `app.json` plugins

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | Yes | v20.17.0 | — |
| expo-location | GPS capture, reverse geocoding | No — not installed | 55.1.6 (via `npx expo install`) | — |
| react-native-maps | Map rendering | No — not installed | 1.27.2 (via `npx expo install`) | — |
| Google Maps Android API key | react-native-maps on Android | Unknown | — | Expo Go works without key; production build blocked without key |
| react-native-reanimated | MapCard expand animation | Yes — 4.2.1 installed | 4.2.1 | — |
| Azure SQL | Location schema | Yes — running | — | — |

**Missing dependencies with no fallback:**
- `expo-location` — must install before any location code can be written
- `react-native-maps` — must install before MapCard can be built

**Missing dependencies with fallback:**
- Google Maps Android API key — development in Expo Go works without it; production Android map will be blank without it. Defer key setup to a Wave 0 task.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 (backend, per `backend/package.json`) |
| Config file | `backend/package.json` ("test": "jest") |
| Quick run command | `cd backend && npm test` |
| Full suite command | `cd backend && npm test` |
| Frontend | No test framework installed (Expo project has no test config) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOC-01 | POST /messages stores lat/lng, upserts member_locations | unit | `cd backend && npm test -- --testPathPattern=messages` | No — Wave 0 |
| LOC-02 | GET /families/:familyId/members/locations returns all members | unit | `cd backend && npm test -- --testPathPattern=locations` | No — Wave 0 |
| LOC-03 | Response includes displayName, address, updatedAt | unit | `cd backend && npm test -- --testPathPattern=locations` | No — Wave 0 |
| LOC-04 | Permission modal shown once, skipped after first ask | manual | Manual — Expo Go device test | — |

### Sampling Rate

- **Per task commit:** `cd backend && npm test`
- **Per wave merge:** `cd backend && npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `backend/src/routes/__tests__/messages.location.test.ts` — covers LOC-01 (lat/lng storage + member_locations upsert)
- [ ] `backend/src/routes/__tests__/locations.test.ts` — covers LOC-02, LOC-03 (members/locations endpoint)

Note: Frontend component tests (LocationPermissionModal, MapCard) are manual-only — React Native component testing requires a native test harness not present in this project.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing JWT middleware (`authenticate`) on all new routes |
| V3 Session Management | no | No new session state |
| V4 Access Control | yes | `member_locations` scoped to `family_id` — same pattern as channels/messages |
| V5 Input Validation | yes | Validate `latitude` (-90 to 90 float), `longitude` (-180 to 180 float) on POST /messages |
| V6 Cryptography | no | No new crypto |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User submits fake coordinates | Tampering | Server accepts coordinates as-is (cannot verify GPS authenticity) — acceptable for family app threat model |
| User reads other families' locations | Information Disclosure | `GET /families/:familyId/members/locations` must verify `req.familyId === params.familyId` |
| Location data included in message broadcast | Information Disclosure | Only include lat/lng in SignalR broadcast if sender's `share_location = true` |
| Bulk coordinate probing | Denial of Service | Existing express-rate-limit on the backend covers POST /messages |

**Input validation for coordinates:**
```typescript
const lat = parseFloat(req.body.latitude);
const lng = parseFloat(req.body.longitude);
if (isNaN(lat) || lat < -90 || lat > 90) { /* reject */ }
if (isNaN(lng) || lng < -180 || lng > 180) { /* reject */ }
```

---

## Sources

### Primary (HIGH confidence)
- `https://docs.expo.dev/versions/latest/sdk/location/` — permission flow, accuracy levels, `reverseGeocodeAsync`, `getForegroundPermissionsAsync`
- `https://docs.expo.dev/versions/latest/sdk/map-view/` — installation, app.json config, Google Maps API key setup, Apple Maps default on iOS
- `npm view expo-location version` — verified 55.1.6
- `npm view react-native-maps version` — verified 1.27.2
- Codebase inspection: `package.json`, `backend/src/db/schema.sql`, `backend/src/routes/messages.ts`, `src/lib/api.ts`, `src/stores/session.tsx`, `src/constants/theme.ts`, `src/components/messages/MessageBubble.tsx`

### Secondary (MEDIUM confidence)
- `https://github.com/expo/expo/issues/42423` — SDK 55 + react-native-maps compatibility issue confirmed resolved; must use react-native-maps own plugin, not legacy Expo `withMaps`
- `STATE.md` — mssql duplicate binding pattern (`@familyId2` workaround) documented as established project pattern

### Tertiary (LOW confidence)
- `Accuracy.Balanced` GPS resolution time (~1–2 seconds) — training knowledge, flagged as A1 in Assumptions Log

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm-verified versions, Expo docs confirmed
- Architecture: HIGH — based on existing codebase patterns + verified library APIs
- Pitfalls: HIGH — pitfall 1/4 verified from docs/GitHub; pitfall 2 flagged as ASSUMED
- Schema design: HIGH — follows existing mssql/Azure SQL patterns in the codebase

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable libraries; react-native-maps releases frequently — recheck if > 30 days)
