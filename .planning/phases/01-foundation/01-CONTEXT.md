# Phase 1: Foundation - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the Azure backend, authentication system, family code onboarding, and the app navigation shell. After this phase, users can create a family, share the code, have others join, and see a working app with tab navigation. No messaging, tasks, or location yet — those come in later phases.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Flow
- **D-01:** First screen design — Claude's discretion (choose between "Create or Join" two-button layout or single-entry screen)
- **D-02:** New user provides display name + email (email for account recovery, no password in v1 — explore passwordless or simple token auth)
- **D-03:** Family creator provides family name only — family code is auto-generated
- **D-04:** Joining is instant — enter valid code and you're in immediately, no approval step

### App Shell & Tabs
- **D-05:** Tab structure: Home (family overview) | Messages | Tasks | Location | Profile — 5 tabs
- **D-06:** Default tab on launch is Home — a dashboard showing family overview / recent activity
- **D-07:** Empty states for unbuilt features (Messages, Tasks, Location) — Claude's discretion

### Claude's Discretion
- First screen layout (D-01) — Claude picks the best UX pattern for create-vs-join
- Empty tab states (D-07) — Claude decides appropriate placeholder content
- Auth strategy — how login/session works on Azure (passwordless, email magic link, or email+password — whatever pairs best with Azure services and the "name + email" identity model)
- Family code format — digits, words, length — whatever is easy to share verbally
- Family code error handling — wrong code, expired code UX

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in:
- `.planning/PROJECT.md` — Project vision, constraints (Azure backend), key decisions
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04, NAV-01, NAV-02
- `.planning/research/STACK.md` — Stack recommendations (note: recommends Supabase but project uses Azure — adapt patterns)
- `.planning/research/ARCHITECTURE.md` — Component boundaries and data model (adapt for Azure)
- `.planning/research/PITFALLS.md` — Family code brute-force prevention, onboarding pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
None — greenfield project, no existing code.

### Established Patterns
None — patterns will be established in this phase.

### Integration Points
- Expo project initialization (React Native)
- Azure backend setup (Azure SQL, Azure Functions or App Service)
- Navigation library setup (React Navigation or Expo Router)

</code_context>

<specifics>
## Specific Ideas

- Home tab is a family overview/dashboard — not just a redirect to messages. This is the landing experience.
- 5-tab layout gives Location its own tab (important since location is tied to messaging in Phase 3)
- Email is collected for future account recovery, not for login verification in v1

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-03*
