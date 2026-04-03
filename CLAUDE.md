<!-- GSD:project-start source:PROJECT.md -->
## Project

**ez.familyapp**

A private family communication app for 5-10 members across iOS and Android. It combines channel-based messaging, location check-ins, and shared task lists into one focused family hub.

**Core Value:** Family members can stay connected and coordinated through one app that replaces scattered group chats, location requests, and shared notes.

### Constraints

- **Platform**: React Native (Expo) — must support both iOS and Android from one codebase
- **Backend**: Azure-native services (Azure SQL, Azure SignalR, Azure Functions / App Service)
- **Infrastructure**: All backend hosted on Azure — no third-party BaaS (Supabase, Firebase, etc.)
- **Privacy**: All data is family-private, no public profiles or discovery
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Expo | SDK 55 | Cross-platform React Native shell | Official React Native recommendation; SDK 55 ships RN 0.83, New Architecture on by default, EAS builds, Expo Go dev workflow. Managed workflow eliminates native build config until needed. |
| React Native | 0.83 (via Expo SDK 55) | Mobile runtime | Included with Expo SDK 55. Do not install separately. |
| TypeScript | 5.x (bundled with Expo) | Language | Type safety across the codebase. Expo templates default to TypeScript; there is no reason to use plain JS. |
| Expo Router | v4 (bundled with SDK 55) | Navigation | File-based routing (like Next.js). Default in `create-expo-app`. Recommended over React Navigation for new projects. Tabs + Stack composition handles app layout directly. |
### Backend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | `@supabase/supabase-js` ^2.x (latest: 2.99.1) | Auth, database, real-time | Single service covering auth (email/password), PostgreSQL, Row Level Security, and WebSocket-based Realtime. The free tier is generous enough for a 5-10 person family app. Self-hostable if privacy becomes a concern later. |
| Supabase Realtime — Broadcast | (part of supabase-js) | Channel messages | Low-latency WebSocket pub/sub. Correct channel type for chat: messages are ephemeral events, not DB polling. Supabase explicitly recommends Broadcast over Postgres Changes for messaging at scale. |
| Supabase Realtime — Postgres Changes | (part of supabase-js) | Task list sync | For shared task lists where persistence is primary — subscribe to DB changes on the tasks table. Simpler than Broadcast for CRUD-driven features. |
| Supabase Auth | (part of supabase-js) | User sessions | Email + password for v1. Family code onboarding is a custom pattern on top: a `families` table with a `join_code` column, enforced via RLS. Users sign up normally, then enter the family code to associate their `user_id` with a family row. |
### State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack Query | ^5.96.x | Server state (messages, tasks, members) | Handles fetching, caching, background refresh, and error states declaratively. Works in React Native with screen-focus refetching hooks built in. v5 is ~20% smaller than v4. |
| Zustand | ^5.0.x | Client/app state (current family, auth session, UI state) | Lightweight Redux-like store with no boilerplate. v5 drops React < 18 support (not a concern for SDK 55). Use for state that is not server data: selected channel, drawer open/closed, etc. |
### UI and Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| NativeWind | v4.x | Utility-class styling | Tailwind CSS classes for React Native. Build-time compiler (no runtime overhead). Familiar if you know Tailwind. v4 pairs with Expo SDK 52-54; check compatibility with SDK 55 before committing — v5 is pre-release. |
| React Native Reanimated | ^3.x (Expo managed) | Animations | Required for smooth gesture-driven UI. Included in Expo SDK. |
| FlashList | ^1.x | Performant message lists | Shopify's replacement for FlatList. Significantly faster for long scrollable lists like message channels. Mandatory for message rendering — FlatList will lag with 100+ messages. |
### Device Features
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-location | latest via `npx expo install` | Location check-in | Official Expo location library. Gets current GPS coordinates on demand (no background tracking needed — the app uses snapshot check-ins). Handles iOS/Android permission dialogs via a consistent API. |
| expo-sqlite | latest via `npx expo install` | Supabase session storage | Required by `@supabase/supabase-js` in React Native as the localStorage polyfill for auth session persistence. |
| react-native-url-polyfill | latest | URL API polyfill | Required by Supabase JS client in React Native environments. |
### Developer Tooling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Expo EAS | cloud service | Build and distribution | Builds iOS `.ipa` and Android `.apk/.aab` in the cloud without requiring a local Mac for iOS builds. Free tier supports personal projects. |
| Expo Go | companion app | Development | Instant reload during development without a full native build. Sufficient for all v1 features (no custom native modules). |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Cross-platform framework | React Native (Expo) | Flutter | PROJECT.md specifies React Native or Flutter. React Native is preferred here: larger ecosystem, JavaScript/TypeScript codebase, better Supabase SDK support, more hiring pool for future contributions. Flutter is excellent but adds Dart. |
| Backend | Supabase | Firebase | Firebase uses Firestore (NoSQL), which is awkward for relational family membership and task queries. RLS in PostgreSQL is superior for multi-tenant data isolation. Firebase pricing can escalate. |
| Backend | Supabase | Custom Node.js + PostgreSQL | A custom backend adds significant dev time with no benefit at this scale. Supabase provides auth, DB, storage, edge functions, and realtime out of the box. |
| Real-time messaging | Supabase Broadcast | Stream Chat, Sendbird | Commercial services with per-MAU pricing. Unnecessary vendor dependency for a 5-10 user family app. |
| Real-time messaging | Supabase Broadcast | Pusher | Same issue — paid per-connection pricing, additional SDK dependency. |
| Navigation | Expo Router | React Navigation (standalone) | Expo Router wraps React Navigation and is the default for new Expo projects since SDK 51+. For a mobile-only app there is no scenario where dropping down to bare React Navigation is needed. |
| State management | Zustand + TanStack Query | Redux Toolkit | RTK is correct for large apps. Zustand removes boilerplate with equivalent capability for a solo/family project. |
| Styling | StyleSheet (plain) | Tamagui | Tamagui is powerful but adds complexity — its compiler, design token system, and universal (web+native) scope are over-engineered for a mobile-only app. NativeWind or plain StyleSheet is the right weight. |
## Installation
# 1. Create project with Expo SDK 55
# 2. Install Supabase and its React Native dependencies
# 3. Install state management
# 4. Install location
# 5. Install FlashList (for message rendering)
# 6. Install React Native Reanimated (likely pre-installed via Expo template)
- Use `npx expo install` (not `npm install`) for Expo packages — it pins the version compatible with your SDK automatically.
- Use `npm install` for non-Expo packages (Zustand, TanStack Query).
- Run `npx expo-doctor` after setup to catch version mismatches.
## Architecture Fit
| Requirement | Stack Component |
|-------------|----------------|
| Channel messaging with real-time delivery | Supabase Realtime Broadcast |
| Message persistence | Supabase PostgreSQL (`messages` table) |
| Location check-ins | `expo-location` getCurrentPositionAsync → stored as a message or check-in row |
| Shared task lists | Supabase PostgreSQL (`tasks` table) + Postgres Changes subscription |
| Family code signup | Supabase Auth (email/password) + custom `families` table with `join_code` |
| Cross-platform iOS + Android | Expo SDK 55 managed workflow |
| Private family data | Supabase Row Level Security policies scoped to `family_id` |
## Sources
- [Expo SDK 55 Release Announcement](https://expo.dev/changelog/sdk-55) — February 25, 2026
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/) — official
- [Supabase + Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — official
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) — official
- [Supabase Realtime Broadcast Guide](https://supabase.com/docs/guides/realtime/broadcast) — official
- [supabase-js on npm — v2.99.1](https://www.npmjs.com/package/@supabase/supabase-js)
- [Zustand v5.0.12 release](https://github.com/pmndrs/zustand/releases)
- [TanStack Query v5.96.1](https://www.npmjs.com/package/@tanstack/react-query)
- [React Native Tech Stack for 2025 — Galaxies.dev](https://galaxies.dev/article/react-native-tech-stack-2025)
- [NativeWind vs Tamagui vs twrnc 2026 — pkgpulse](https://www.pkgpulse.com/blog/nativewind-vs-tamagui-vs-twrnc-react-native-styling-2026)
- [expo-location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Navigation v7 vs Expo Router — Viewlytics](https://viewlytics.ai/blog/react-navigation-7-vs-expo-router)
- [Supabase Group Invite Code Discussion](https://github.com/orgs/supabase/discussions/26337)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
