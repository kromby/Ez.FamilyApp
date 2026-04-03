# Phase 1: Foundation - Research

**Researched:** 2026-04-03
**Domain:** React Native (Expo) app bootstrap, Azure-native backend (App Service + Azure SQL), custom JWT auth with email OTP, family code onboarding, Expo Router tab navigation shell
**Confidence:** MEDIUM-HIGH — Expo/React Native findings verified via official docs; Azure stack findings verified via Microsoft Learn official docs; auth pattern verified via multiple sources

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-02: New user provides display name + email (email for account recovery, no password in v1 — passwordless or simple token auth)
- D-03: Family creator provides family name only — family code is auto-generated
- D-04: Joining is instant — enter valid code and you're in immediately, no approval step
- D-05: Tab structure: Home (family overview) | Messages | Tasks | Location | Profile — 5 tabs
- D-06: Default tab on launch is Home — a dashboard showing family overview / recent activity
- Backend: Azure-native services ONLY — Azure SQL, Azure Functions / App Service — NOT Supabase, NOT Firebase
- Platform: React Native (Expo) — iOS and Android from one codebase
- Privacy: Family-private, no public profiles or discovery

### Claude's Discretion
- D-01: First screen layout (Claude picks create-vs-join UX)
- D-07: Empty tab states (Claude decides placeholder content)
- Auth strategy — how login/session works on Azure (passwordless, email magic link, or email+password)
- Family code format — digits, words, length
- Family code error handling UX

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create a new family and receive a family code | Azure App Service REST endpoint + Azure SQL `families` table with auto-generated code; rate limiting on join endpoint |
| AUTH-02 | User can join an existing family by entering a family code | REST POST /families/join endpoint; brute-force prevention (8-char alphanumeric code + rate limiting) |
| AUTH-03 | User can set a display name during signup | `users` table with `display_name` column; collected after create or join flow |
| AUTH-04 | User session persists across app restarts | JWT stored in `expo-secure-store` (Keychain/Keystore); loaded in Expo Router root layout; `Stack.Protected` guard pattern |
| NAV-01 | App has tab-based navigation (messages, tasks, location, profile) | Expo Router v4 `(tabs)` route group; 5-tab layout with Home as default |
| NAV-02 | App shows which family the user belongs to | Family name stored in Zustand after auth; displayed in Home tab nav bar title and Profile tab |
</phase_requirements>

---

## Summary

Phase 1 builds the complete foundation: an Azure-hosted Node.js REST API backed by Azure SQL, a custom JWT + email-OTP auth system (no password), a family code onboarding flow, and a React Native (Expo) app with tab navigation shell. There is no existing code — this is a greenfield project.

The existing research documents (STACK.md, ARCHITECTURE.md) were written assuming Supabase. For this phase, every backend decision must use Azure-native alternatives: Azure App Service (not Supabase) for the REST API, Azure SQL (not PostgreSQL/Supabase) as the database, and a custom JWT session system (not Supabase Auth). The frontend stack (Expo SDK 55, Expo Router v4, Zustand, TanStack Query, expo-secure-store) is unchanged.

The auth model is deliberately simple: email + display name on signup, a short-lived email OTP (no magic links requiring deep-link setup) to verify identity, and a long-lived JWT stored in `expo-secure-store` for session persistence. This trades a small UX step (enter OTP code) for zero deep-link configuration complexity in v1. The family code onboarding layer is a separate custom concern layered on top of auth.

**Primary recommendation:** Use Azure App Service (Basic B1 or Free F1) running a Node.js/Express app as the API server, backed by Azure SQL Database (serverless free tier). Do NOT use Azure Functions for this — a persistent Express server avoids cold start latency on a family app where auth + join operations happen on first launch and delays break UX.

---

## Standard Stack

### Core — Frontend

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Expo | SDK 55 | Cross-platform React Native shell | Current stable (Feb 2026); ships RN 0.83, New Architecture on by default |
| React Native | 0.83 (via Expo) | Mobile runtime | Included with Expo SDK 55; do not install separately |
| TypeScript | 5.x (bundled) | Language | Expo templates default to TypeScript; no reason to use plain JS |
| Expo Router | v4 (bundled with SDK 55) | Navigation + auth routing | File-based routing; `Stack.Protected` for auth gating; tabs built-in |
| Zustand | ^5.0.x | Client state (auth session, family data, UI state) | Lightweight; no boilerplate; v5 stable |
| TanStack Query | ^5.96.x | Server state fetching and caching | Handles loading/error states; screen-focus refetching |
| expo-secure-store | via `npx expo install` | JWT storage | Uses iOS Keychain + Android Keystore; required for auth persistence |
| @expo/vector-icons | bundled with Expo | Tab bar icons (Ionicons) | Zero extra install; Ionicons set covers all 5 tab icons |

### Core — Backend

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 20 LTS | Runtime | Current LTS; Azure App Service supports it natively |
| Express | ^4.x | HTTP framework | Standard Node.js web server; familiar, no overhead |
| mssql | ^12.2.1 | Azure SQL client | Official Microsoft SQL Server driver for Node.js; supports pooling |
| jsonwebtoken | ^9.0.3 | JWT issue + verify | Standard JWT library for Node.js; sign/verify access tokens |
| jose | ^6.2.2 | Alternative JWT (ES256) | More modern than jsonwebtoken; useful if wanting asymmetric keys |
| nodemailer | ^8.0.4 | Email OTP delivery | Sends OTP email; pairs with Azure Communication Services SMTP or any SMTP |
| @azure/identity | latest | Passwordless DB auth | `DefaultAzureCredential` for managed identity DB connection in production |

### Supporting — Frontend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-url-polyfill | latest | URL API polyfill | Required for any fetch/URL usage in React Native |
| expo-splash-screen | via Expo | Hold splash until auth loads | Required — auth check is async; prevents flash of wrong screen |

### Supporting — Backend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cors | ^2.x | CORS headers for mobile client | Required — Expo dev client sends requests from different origin |
| dotenv | ^16.x | Environment variable loading | Local dev; production uses App Service application settings |
| helmet | ^8.x | HTTP security headers | Always include for production APIs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Azure App Service (persistent) | Azure Functions (serverless) | Functions have cold start latency (up to 2-3s) — unacceptable for auth on first launch; App Service avoids this |
| Azure App Service | Azure Container Apps | Container Apps adds Docker complexity for a simple Express server; over-engineered for v1 |
| Custom JWT + email OTP | Azure Entra External ID (B2C) | B2C has configuration complexity, per-MAU pricing model, and requires OAuth flows — overkill for a private family app |
| email OTP (6-digit code) | Email magic link | Magic links require deep-link setup (app scheme, Expo Auth Session config) — extra complexity for v1; OTP avoids this entirely |
| mssql | Prisma + mssql | Prisma adds a schema file and migration tooling that is useful for large apps but overkill for 5 tables; raw mssql is simpler to reason about |

**Installation:**

```bash
# Frontend — use npx expo install for Expo-managed packages
npx create-expo-app@latest ez-familyapp --template default@sdk-55
npx expo install expo-secure-store expo-splash-screen react-native-url-polyfill
npm install zustand @tanstack/react-query

# Backend — plain npm
mkdir backend && cd backend && npm init -y
npm install express mssql jsonwebtoken nodemailer cors dotenv helmet
npm install --save-dev typescript @types/node @types/express @types/jsonwebtoken ts-node
npm install @azure/identity
```

**Version verification (run before writing lock files):**
```bash
npm view mssql version          # should be 12.2.1+
npm view jsonwebtoken version   # should be 9.0.3+
npm view nodemailer version     # should be 8.0.4+
npm view express version        # should be 4.x
```

---

## Architecture Patterns

### Recommended Project Structure

```
ez-familyapp/                  (repo root)
├── app/                       (Expo Router file-based routes)
│   ├── _layout.tsx            (root layout — SessionProvider + SplashController)
│   ├── (auth)/                (auth route group — shown when NOT logged in)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx        (Create / Join two-button landing)
│   │   ├── create-family.tsx
│   │   ├── share-code.tsx
│   │   ├── join-family.tsx
│   │   ├── verify-otp.tsx     (email OTP entry)
│   │   └── set-name.tsx
│   └── (tabs)/                (tab shell — shown when logged in)
│       ├── _layout.tsx        (tab bar config)
│       ├── index.tsx          (Home tab)
│       ├── messages.tsx       (empty state)
│       ├── tasks.tsx          (empty state)
│       ├── location.tsx       (empty state)
│       └── profile.tsx
├── src/
│   ├── api/                   (API client functions — axios/fetch wrappers)
│   ├── stores/                (Zustand stores)
│   ├── hooks/                 (custom hooks)
│   ├── components/            (shared UI components)
│   └── constants/             (colors, spacing tokens from UI-SPEC)
├── backend/                   (Express API — can be separate repo later)
│   ├── src/
│   │   ├── index.ts           (Express app entry point)
│   │   ├── routes/
│   │   │   ├── auth.ts        (POST /auth/request-otp, POST /auth/verify-otp)
│   │   │   ├── families.ts    (POST /families, POST /families/join)
│   │   │   └── users.ts       (POST /users)
│   │   ├── middleware/
│   │   │   └── authenticate.ts (JWT verification middleware)
│   │   ├── db/
│   │   │   ├── connection.ts   (mssql pool setup)
│   │   │   └── schema.sql      (CREATE TABLE statements)
│   │   └── lib/
│   │       ├── familyCode.ts   (code generation + validation)
│   │       └── mailer.ts       (nodemailer OTP sender)
│   ├── package.json
│   └── tsconfig.json
└── CLAUDE.md
```

### Pattern 1: Expo Router Auth Gating with Stack.Protected

**What:** Root layout wraps the entire navigator in a `SessionProvider`. `Stack.Protected` uses a guard prop to conditionally render either the `(auth)` route group or the `(tabs)` route group. Expo Router handles redirect automatically.

**When to use:** Always — this is the canonical Expo Router auth pattern as of SDK 55 / Router v4.

```typescript
// Source: https://docs.expo.dev/router/advanced/authentication/
// app/_layout.tsx
import { Stack } from 'expo-router';
import { SessionProvider, useSession } from '../src/stores/session';
import { SplashScreen } from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hideAsync();
  }

  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Layout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
```

### Pattern 2: Session Store with expo-secure-store Persistence

**What:** Zustand store that hydrates from `expo-secure-store` on app start, persisting the JWT and user data across restarts.

**When to use:** Whenever an auth token needs to survive app restart (AUTH-04).

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/securestore/
// src/stores/session.tsx
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

interface SessionState {
  token: string | null;
  user: { id: string; displayName: string; familyId: string; familyName: string } | null;
  isLoading: boolean;
  signIn: (token: string, user: SessionState['user']) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  signIn: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },
  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userRaw = await SecureStore.getItemAsync(USER_KEY);
    const user = userRaw ? JSON.parse(userRaw) : null;
    set({ token, user, isLoading: false });
  },
}));
```

### Pattern 3: Email OTP Auth Flow (Backend)

**What:** Two-step auth: (1) user provides email → server stores a 6-digit OTP + 10-min expiry in Azure SQL, sends email via nodemailer; (2) user enters OTP → server validates, issues JWT, deletes OTP record.

**When to use:** This is the v1 auth strategy — no passwords, no OAuth, no deep links.

```typescript
// Source: research — standard Node.js pattern
// backend/src/routes/auth.ts

// Step 1: Request OTP
app.post('/auth/request-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert OTP record in Azure SQL
  await pool.request()
    .input('email', sql.NVarChar, email)
    .input('otp', sql.NVarChar, otp)
    .input('expiresAt', sql.DateTime, expiresAt)
    .query(`
      MERGE otp_requests AS target
      USING (SELECT @email AS email) AS source ON target.email = source.email
      WHEN MATCHED THEN UPDATE SET otp = @otp, expires_at = @expiresAt, attempts = 0
      WHEN NOT MATCHED THEN INSERT (email, otp, expires_at, attempts)
        VALUES (@email, @otp, @expiresAt, 0);
    `);

  await sendOtpEmail(email, otp); // nodemailer
  res.json({ message: 'OTP sent' });
});

// Step 2: Verify OTP, issue JWT
app.post('/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  const result = await pool.request()
    .input('email', sql.NVarChar, email)
    .input('otp', sql.NVarChar, otp)
    .query(`
      SELECT * FROM otp_requests
      WHERE email = @email AND otp = @otp AND expires_at > GETUTCDATE()
    `);

  if (!result.recordset.length) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }

  // Delete OTP so it cannot be reused
  await pool.request().input('email', sql.NVarChar, email)
    .query(`DELETE FROM otp_requests WHERE email = @email`);

  // Look up or create the user record
  // ... (user creation/lookup logic)

  const token = jwt.sign({ userId, familyId }, process.env.JWT_SECRET!, {
    expiresIn: '90d',
  });

  res.json({ token, user: { id: userId, displayName, familyId, familyName } });
});
```

### Pattern 4: Family Code Generation and Join

**What:** Server generates an 8-character alphanumeric code (uppercase letters + digits, excluding ambiguous chars 0/O/1/I/L) when a family is created. The join endpoint validates the code and returns the family info.

**When to use:** AUTH-01 and AUTH-02.

```typescript
// backend/src/lib/familyCode.ts
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0,O,1,I,L

export function generateFamilyCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

// POST /families
app.post('/families', authenticate, async (req, res) => {
  const { name } = req.body;
  let code: string;
  let attempts = 0;

  // Collision loop — astronomically unlikely but correct
  do {
    code = generateFamilyCode();
    const existing = await pool.request()
      .input('code', sql.NVarChar, code)
      .query('SELECT id FROM families WHERE code = @code');
    if (!existing.recordset.length) break;
    attempts++;
  } while (attempts < 5);

  const familyId = uuid();
  await pool.request()
    .input('id', sql.UniqueIdentifier, familyId)
    .input('name', sql.NVarChar, name)
    .input('code', sql.NVarChar, code)
    .query('INSERT INTO families (id, name, code, created_at) VALUES (@id, @name, @code, GETUTCDATE())');

  res.json({ familyId, code });
});

// POST /families/join (rate-limited — max 5 attempts per 15 min per IP)
app.post('/families/join', joinRateLimiter, async (req, res) => {
  const { code } = req.body;
  const result = await pool.request()
    .input('code', sql.NVarChar, code.toUpperCase())
    .query('SELECT id, name FROM families WHERE code = @code');

  if (!result.recordset.length) {
    // Same error message whether invalid or expired — prevents enumeration
    return res.status(404).json({ error: 'Family not found. Check the code and try again.' });
  }

  res.json({ familyId: result.recordset[0].id, familyName: result.recordset[0].name });
});
```

### Pattern 5: Azure SQL Connection Pool (mssql)

**What:** Single connection pool instance shared across all routes; initialized once at server startup.

```typescript
// Source: https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-sql-javascript-mssql-quickstart
// backend/src/db/connection.ts
import sql from 'mssql';

const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER!,
  port: 1433,
  database: process.env.AZURE_SQL_DATABASE!,
  // Local dev: SQL auth. Production: managed identity via @azure/identity
  authentication: {
    type: process.env.NODE_ENV === 'production'
      ? 'azure-active-directory-default'
      : 'default',
  },
  user: process.env.AZURE_SQL_USER,         // dev only
  password: process.env.AZURE_SQL_PASSWORD, // dev only
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMilliseconds: 30000,
  },
};

let pool: sql.ConnectionPool;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}
```

### Anti-Patterns to Avoid

- **Using AsyncStorage for JWT:** AsyncStorage is unencrypted on Android. Always use `expo-secure-store` (Keychain/Keystore backed). Source: ARCHITECTURE.md Anti-Pattern 1.
- **Using Azure Functions for the API:** Cold starts on Consumption plan can reach 2-3 seconds. A family member's first action after installing is auth — that delay kills UX. Use App Service (persistent process) instead.
- **Using short or numeric-only family codes:** A 4-6 digit numeric code is brute-forceable in minutes without rate limiting. Use 8-char alphanumeric (excludes ambiguous chars). Source: PITFALLS.md Pitfall 2.
- **Requesting location permission in onboarding:** Phase 1 does not use location. Never request it here. Source: PITFALLS.md Pitfall 4.
- **Storing JWT in component state only:** State is lost when app is closed. Hydrate from SecureStore on app start, before the root navigator renders.
- **Different error messages for invalid vs expired codes:** Reveals information to an enumerator. Return identical error copy for both. Source: PITFALLS.md Pitfall 2.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secure token storage on device | Custom encrypted AsyncStorage wrapper | `expo-secure-store` | Uses OS Keychain (iOS) and Keystore (Android) — OS-level security guarantees |
| Tab navigation with auth gating | Manual React Navigation stack with guards | Expo Router `Stack.Protected` + route groups | Built-in pattern in Router v4; handles redirect, deep link, and splash screen automatically |
| Azure SQL queries with injection protection | String-concatenated SQL | `mssql` parameterized queries with `.input()` | Parameterized queries are mandatory for SQL injection prevention |
| JWT sign/verify | Custom token encoding | `jsonwebtoken` library | Battle-tested; handles expiry, signature, and algorithm correctly |
| Family code brute-force protection | Track attempts in application memory | `express-rate-limit` middleware per route | In-memory rate limiter is reset on server restart; express-rate-limit is lightweight and correct |
| Email delivery | Direct SMTP socket code | `nodemailer` | Handles retries, connection pooling, and TLS negotiation |

**Key insight:** In a React Native + Azure stack, the biggest sources of accidental custom implementation are token storage and navigation auth gating — both have first-class solutions that are far safer than hand-rolled equivalents.

---

## Common Pitfalls

### Pitfall 1: Cold Start on Azure Functions Breaks Auth UX
**What goes wrong:** If Azure Functions (Consumption plan) is used instead of App Service, the first HTTP request after a period of inactivity triggers a cold start that can take 2-3+ seconds. The first thing a new user does is auth — a 3-second spinner on the "Join Family" button is trust-destroying.
**Why it happens:** Serverless functions scale to zero; the runtime must warm up before handling a request.
**How to avoid:** Use Azure App Service (Basic B1 or Free F1) which is a persistent process — zero cold start.
**Warning signs:** `POST /auth/request-otp` takes >1s in production during low-traffic periods.

### Pitfall 2: Splash Screen Dismissed Before Auth State Loads
**What goes wrong:** App renders the tab shell for a split second before the session token loads from SecureStore, then jumps to the auth screen — visible flash of wrong content.
**Why it happens:** `SecureStore.getItemAsync` is async; if the splash is dismissed too early, the navigator renders before the guard value is known.
**How to avoid:** Call `SplashScreen.preventAutoHideAsync()` in the root layout. Only call `SplashScreen.hideAsync()` after `isLoading === false` in the session store.
**Warning signs:** Brief white flash or wrong-screen flash on cold start.

### Pitfall 3: Family Code Is Brute-Forceable
**What goes wrong:** The join endpoint has no rate limiting. A bot can enumerate 8-char codes or dictionary-attack short codes.
**Why it happens:** Teams treat the code as a URL slug, not an auth mechanism.
**How to avoid:** Rate-limit `/families/join` to 5 attempts per IP per 15 minutes. Use `express-rate-limit`. Use 8-char code with the unambiguous 32-character alphabet (36^8 equivalent space = ~2.8T combinations). Source: PITFALLS.md Pitfall 2.
**Warning signs:** No rate limiting middleware on the join route.

### Pitfall 4: Azure SQL Firewall Blocks Local Dev
**What goes wrong:** The backend connects to Azure SQL in production but fails locally with a connection refused or timeout error.
**Why it happens:** Azure SQL has a server-level firewall; local machine IP must be explicitly allowed.
**How to avoid:** In Azure portal > SQL Server > Networking: add your local IP, and check "Allow Azure services to access this server." For production, use managed identity instead of SQL auth credentials.
**Warning signs:** `ConnectionError: Failed to connect to server` during local development.

### Pitfall 5: OTP Not Deleted After Use (Replay Attack)
**What goes wrong:** A valid OTP is accepted, but the record is not deleted from the `otp_requests` table. The same 6-digit code works again for 10 minutes.
**Why it happens:** DELETE is omitted or only runs on success path.
**How to avoid:** Always `DELETE FROM otp_requests WHERE email = @email` immediately after successful verification — before issuing the JWT.
**Warning signs:** Same OTP works twice within the expiry window.

### Pitfall 6: Onboarding Flow Order Wrong
**What goes wrong:** User sees "enter your name" before they have committed to a family. Or the family creation happens before OTP is verified — family is created for unauthenticated users.
**Why it happens:** Flow is designed in isolation from auth state.
**How to avoid:** Enforce this exact flow: Welcome → Create Family (or Join) → Request OTP → Verify OTP → Set Display Name → App. The JWT is only issued after OTP verification. Family association happens after JWT exists.
**Warning signs:** Family rows in DB with no associated user; display name asked before email.

### Pitfall 7: Cross-Platform Keyboard Overlap (Android vs iOS)
**What goes wrong:** The family code input and OTP input screens work on iOS but keyboard overlaps the input on Android.
**Why it happens:** iOS and Android handle software keyboard resize differently.
**How to avoid:** Wrap every form screen in `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`. Test on a real Android device from day one. Source: PITFALLS.md Pitfall 8.
**Warning signs:** Input field invisible when keyboard opens on Android.

---

## Azure Infrastructure Notes

### Azure SQL Database — Free Tier
- Free offer: 100,000 vCore-seconds/month + 32 GB storage, serverless General Purpose tier
- Up to 10 free databases per Azure subscription
- Pauses automatically when idle; resumes on next query (< 1s warm-up for DB, unlike Functions)
- Sufficient for a 5-10 person family app indefinitely on the free tier
- Source: Microsoft Learn — free offer page (verified April 2026)

### Azure App Service — Tier Guidance
- Free (F1): Shared infrastructure, no custom domain, 60 CPU min/day — fine for dev/testing
- Basic (B1): ~$13/month, dedicated VM, custom domain, always-on — recommended for production
- The "always-on" setting on B1 prevents idle process recycling (which would reintroduce cold starts)
- For a family app with 5-10 users, B1 is the lowest viable production tier

### Azure App Service vs Azure Functions Decision
- **Use App Service:** Auth flows, REST API for family/user management — all user-facing operations where latency matters
- **Use Functions if desired in future:** Background tasks, scheduled jobs (e.g., expire old OTP records) — where cold start is acceptable
- For Phase 1, App Service only.

### Deployment
- Local dev: SQL auth (username + password) in `.env` file
- Production: Managed Identity — App Service system-assigned identity granted DB roles via Azure portal
- Service Connector CLI (`az webapp connection create sql --system-identity`) automates the managed identity setup

---

## Runtime State Inventory

Not applicable — this is a greenfield project with no existing runtime state. No databases to migrate, no stored data, no registered OS state, no existing build artifacts. Step 2.5 SKIPPED: greenfield phase.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend Express server | To verify at build time | Expect 20 LTS | — |
| npm | Package installation | To verify at build time | — | — |
| Azure subscription | Azure SQL + App Service | Unknown — user must have one | — | No fallback; required by project constraints |
| Azure CLI (`az`) | Managed identity setup | Unknown | — | Manual portal steps documented |
| Expo Go (iOS/Android) | Mobile dev testing | Unknown — user installs | — | EAS Build (slower but works) |
| EAS CLI | App builds | Unknown | — | `npx eas` works without global install |

**Missing dependencies with no fallback:**
- Azure subscription — the entire backend requires it; this is a user-side prerequisite

**Missing dependencies with fallback:**
- Azure CLI — managed identity can be set up manually via Azure portal if CLI is not available
- Expo Go — EAS Build is the fallback for testing on device

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via Expo default template) + React Native Testing Library |
| Config file | `jest.config.js` — Wave 0 gap (not yet created) |
| Quick run command | `npx jest --testPathPattern="auth\|family\|navigation" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Family creation returns a valid 8-char code | unit (backend) | `npx jest --testPathPattern="familyCode"` | Wave 0 gap |
| AUTH-01 | POST /families endpoint creates DB row + returns code | integration (backend) | `npx jest --testPathPattern="families.route"` | Wave 0 gap |
| AUTH-02 | Valid code joins family; invalid code returns 404 | integration (backend) | `npx jest --testPathPattern="families.route"` | Wave 0 gap |
| AUTH-02 | Rate limit blocks >5 attempts per 15 min | integration (backend) | `npx jest --testPathPattern="rateLimit"` | Wave 0 gap |
| AUTH-03 | Display name stored on user record | integration (backend) | `npx jest --testPathPattern="users.route"` | Wave 0 gap |
| AUTH-04 | JWT persists to SecureStore and rehydrates | unit (frontend) | `npx jest --testPathPattern="session.store"` | Wave 0 gap |
| AUTH-04 | App navigates to tabs on rehydrated session | unit (frontend, RNTL) | `npx jest --testPathPattern="RootNavigator"` | Wave 0 gap |
| NAV-01 | Tab layout renders all 5 tabs | unit (frontend, RNTL) | `npx jest --testPathPattern="TabLayout"` | Wave 0 gap |
| NAV-02 | Family name appears in Home tab header | unit (frontend, RNTL) | `npx jest --testPathPattern="HomeScreen"` | Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="familyCode\|session.store" --passWithNoTests`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/__tests__/familyCode.test.ts` — covers AUTH-01 code generation
- [ ] `backend/__tests__/families.route.test.ts` — covers AUTH-01, AUTH-02
- [ ] `backend/__tests__/users.route.test.ts` — covers AUTH-03
- [ ] `backend/__tests__/rateLimit.test.ts` — covers AUTH-02 brute-force protection
- [ ] `src/__tests__/session.store.test.ts` — covers AUTH-04 persistence
- [ ] `src/__tests__/RootNavigator.test.tsx` — covers AUTH-04 routing guard
- [ ] `src/__tests__/TabLayout.test.tsx` — covers NAV-01
- [ ] `src/__tests__/HomeScreen.test.tsx` — covers NAV-02
- [ ] `jest.config.js` + `babel.config.js` — test runner setup (Wave 0)
- [ ] Framework install: `npm install --save-dev jest @testing-library/react-native ts-jest`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation (manual) | Expo Router v4 with file-based routing | SDK 51+ (2024) | Auth gating via `Stack.Protected` instead of custom navigator logic |
| AsyncStorage for tokens | `expo-secure-store` | 2022 (security best practice) | Tokens use OS Keychain/Keystore; not accessible to other apps |
| Supabase Auth (assumed in STACK.md) | Custom JWT + Azure | Project constraint (2026) | Manual OTP flow; no RLS — app-layer data isolation instead |
| Azure Functions (Consumption) for APIs | Azure App Service for REST APIs | Ongoing — cold start concern | No cold start on App Service; consistent latency for mobile clients |

**Deprecated/outdated (from prior research docs):**
- `@supabase/supabase-js` and all Supabase patterns: Not applicable — project uses Azure backend. Ignore all Supabase references in STACK.md and ARCHITECTURE.md when implementing Phase 1.
- `expo-sqlite` for session storage: STACK.md listed this as "required for Supabase session storage." Not needed for custom JWT + SecureStore pattern.
- `react-native-url-polyfill`: Still needed for React Native fetch API compatibility.

---

## Open Questions

1. **Email delivery service for OTP**
   - What we know: `nodemailer` sends email; needs an SMTP provider
   - What's unclear: The project has no specified SMTP provider. Options: (a) Azure Communication Services Email (Azure-native, free tier exists), (b) SendGrid (free 100/day), (c) Gmail SMTP (development only, not production)
   - Recommendation: Use Azure Communication Services Email for consistency with Azure stack. Verify free tier limits at planning time. SendGrid is a simpler fallback if ACS setup proves complex.

2. **Backend monorepo vs separate repo**
   - What we know: Currently planning a monorepo (`ez-familyapp/backend/`) for simplicity
   - What's unclear: Azure App Service deployment from a subdirectory requires configuring the app root; not a default
   - Recommendation: Monorepo for v1. Configure App Service deployment source to `backend/` subdirectory via Azure portal > Configuration > General Settings > Virtual application path. Document this in implementation.

3. **OTP delivery reliability in development**
   - What we know: Gmail SMTP requires app passwords and is rate-limited; not suitable for production
   - What's unclear: Whether the developer has an Azure subscription and can provision Azure Communication Services during Phase 1
   - Recommendation: Plan should include a dev-mode bypass — if `NODE_ENV=development`, log OTP to console instead of sending email. This unblocks development without requiring email credentials.

---

## Sources

### Primary (HIGH confidence)
- [Expo Router Authentication Docs](https://docs.expo.dev/router/advanced/authentication/) — `Stack.Protected`, session context pattern, splash screen control
- [Microsoft Learn: Azure SQL + Node.js mssql Quickstart](https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-sql-javascript-mssql-quickstart?view=azuresql) — mssql connection config, passwordless managed identity, Express integration
- [Microsoft Learn: Azure SQL Free Offer](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer?view=azuresql) — free tier limits, serverless behavior
- [Expo SecureStore Docs](https://docs.expo.dev/versions/latest/sdk/securestore/) — iOS Keychain + Android Keystore storage
- [Microsoft Learn: Azure Functions Node.js v4 Migration](https://learn.microsoft.com/en-us/azure/azure-functions/functions-node-upgrade-v4) — v4 programming model, HTTP triggers

### Secondary (MEDIUM confidence)
- [Expo: Simplifying auth flows with protected routes](https://expo.dev/blog/simplifying-auth-flows-with-protected-routes) — confirmed `Stack.Protected` is recommended Router v4 pattern
- [Microsoft Tech Community: Azure SQL Free Offer](https://techcommunity.microsoft.com/blog/azuresqlblog/how-to-get-a-free-azure-sql-database-or-managed-instance/4471390) — confirmed free tier details
- [Implementing Magic Link Authentication in Node.js](https://implementing.substack.com/p/how-to-implement-a-magic-link-authentication) — OTP/token flow patterns
- Multiple WebSearch results on Azure App Service vs Functions comparison — consistent finding that App Service preferred for latency-sensitive APIs

### Tertiary (LOW confidence)
- npm version lookups (`mssql@12.2.1`, `jsonwebtoken@9.0.3`, `nodemailer@8.0.4`) — verified against npm registry at research time

---

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md are actionable constraints the planner must verify:

1. **Platform:** React Native (Expo) — must support iOS and Android from one codebase. No web-only libraries.
2. **Backend:** Azure-native services ONLY — Azure SQL, Azure SignalR, Azure Functions / App Service. No Supabase, Firebase, or other BaaS.
3. **Infrastructure:** All backend hosted on Azure. No third-party BaaS.
4. **Privacy:** Family-private. No public profiles or discovery.
5. **GSD workflow enforcement:** All file changes must go through a GSD command entry point (no direct repo edits outside a workflow).
6. **Styling:** Plain React Native `StyleSheet` — NativeWind v5 is pre-release for SDK 55; do not introduce it in Phase 1. (Source: STACK.md recommendation, confirmed in UI-SPEC.md)
7. **State management:** Zustand (client state) + TanStack Query (server state). Not Redux.
8. **Navigation:** Expo Router v4. Not standalone React Navigation.
9. **Code format:** TypeScript throughout — both frontend and backend.

---

## Metadata

**Confidence breakdown:**
- Standard stack (frontend): HIGH — Expo SDK 55 / Router v4 verified via official docs; expo-secure-store verified via official docs
- Standard stack (backend): HIGH — mssql, Azure SQL, App Service all verified via Microsoft Learn official docs
- Auth pattern (email OTP): MEDIUM — verified as a well-established Node.js pattern; Azure-specific integration verified; exact OTP email provider (ACS vs SendGrid) is an open question
- Architecture patterns: MEDIUM-HIGH — Expo Router auth pattern from official docs (HIGH); Azure backend patterns from official docs (HIGH); family code generation (MEDIUM — standard practice)
- Pitfalls: HIGH — cold start (verified), brute force (PITFALLS.md), splash screen timing (Expo docs), SQL injection (mssql docs)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days — Azure and Expo release cycles; recheck Expo SDK if Expo Router v4 minor updates are released)
