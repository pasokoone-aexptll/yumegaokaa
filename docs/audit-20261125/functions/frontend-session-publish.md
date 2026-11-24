## `sessionState.publish` in apps/mobile/src/lib/sessionState.ts (L18-L36)

**Purpose:** Publish local login identity changes to mounted UI and clear account-specific drafts.

**Inputs & Assumptions:** `session` is an Auth adapter result, semi-trusted as local state; signed_in and email are the only identity fields (L7). Native wrappers call it after session queries or successful logout (`native.ts:91-110`). Uniqueness of email across all possible backends/account recreation: nothing found here.

**Outputs & Effects:** Clears five draft/selection/block stores on change, replaces module state, increments revision only on change, invokes subscribers synchronously.

**Block-by-Block:**

```ts
// L19-L22
const email = session.signed_in ? session.email : "";
const changed = state.signed_in !== session.signed_in || state.email !== email;
if (state.ready && !changed) return;
```

Normalizes signed-out identity, suppresses unchanged notifications. The comment in native.ts:89-90 explains the same-account OTP withdrawal requirement. It assumes same email means same displayed identity; a project/account ID comparison is absent.

```ts
// L23-L36
if (changed) { /* clear draft, placement, local block state */ }
state = { ready: true, signed_in: session.signed_in, email,
  revision: state.revision + (changed ? 1 : 0) };
listeners.forEach((listener) => listener());
```

Clear happens before subscribers see the new revision. ownProfile subscribes and discards profile by revision (`ownProfile.ts:11-15`); Avatar observes revision and changes identity (`Avatar.tsx:43-69`). All subscribers are assumed to tolerate synchronous invocation; no exception isolation is provided here.

**Cross-Function Dependencies:** Draft clear functions are internal; detailed implementations outside this bounded pass. Callers native.session/verifyOTP/logout depend on revision changes to remount routes. _layout.tsx:106-111 keys the Stack by revision (plus access status on iOS).

**Open Questions:** Same-email recreated accounts, separate backend projects and listener failures require explicit tests before using this store for a runtime demo switch.
