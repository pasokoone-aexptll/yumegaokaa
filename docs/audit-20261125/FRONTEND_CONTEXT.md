# Frontend/auth context dossier — 2026-11-25

This is a bounded context map under audit-context-building, not a vulnerability verdict. Application source was read only. No live accounts, private data, remote requests or mutations were used. Parent audit owns database validation and reproduction.

## Orientation and coverage

Runtime: Expo/React Native TypeScript; iOS uses a Swift actor for Auth/RPC, Android uses supabase-js and Expo SecureStore. `native.ts:78` selects platformAuth when defined; `platformAuth.ios.ts:1-2` leaves it undefined, routing iOS to PresenceNative. The native bridge exposes configure/session/OTP/RPC/visit/logout at `PresenceNativeModule.swift:87-115`.

Read: native.ts auth wrapper/configuration; iOS APIClient.swift complete; sessionState.ts complete; platformAuth.android.ts configuration/auth/RPC/logout plus entry/exit persistence boundaries; useAccountAccess.ts complete; _layout.tsx routing; avatar.ts complete; avatarImages.ts complete; ownProfile.ts complete; Avatar.tsx identity/load; consent.tsx; RegistrationDeclarationForm submit/load; useWithdrawal.ts complete; useStreetMap initialization/login/socket lifecycle excerpts. Not read exhaustively: PresenceEngine implementation, every map/chat/PIN hook, all Android observation functions, push implementation, supabase-js internals, Expo image/cache native internals. No claim of full frontend audit.

## Reachability and actual call chains

| Entry | Chain and effects | Evidence |
| --- | --- | --- |
| App/Home mount | useStreetMap → native.configure(build-time URL/key) → native.session → sessionState.publish; native events subscription | useStreetMap.ts:169-196; native.ts:91-123 |
| OTP login | login → sendOTP or verifyLoginOTP → native Auth verification → 1100ms success presentation → session publish | useStreetMap.ts:287-310; native.ts:80-87; APIClient.swift:64-80 |
| Account routing | session revision → account_access; active → profile_get → street_icon_get; route consent/profile/pool/unregistered/access | useAccountAccess.ts:31-87; _layout.tsx:72-98 |
| Existing user consent | policy read → form declaration → consent_accept → access.retry | RegistrationDeclarationForm.tsx:37-77; consent.tsx:10-12 |
| Profile/pool image | picker → resize/encode ≤2MB → strip metadata → authorized Storage POST → publish RPC | avatar.ts:34-96,101-150 |
| Logout iOS | PresenceEngine.stop (error ignored) → PushNotifications.stop → APIClient.logout → JS signed-out publish | PresenceNativeModule.swift:112-115; APIClient.swift:179-186; native.ts:108-110 |
| Logout Android | stopObservation → serialized mode-key removal → get_my_visit/end_visit → FCM unregister → local signOut → JS publish | platformAuth.android.ts:362-376; native.ts:108-110 |
| Withdrawal | accountDetails → withdraw_prepare → email OTP → verifyOTP → withdraw_confirm → logout | useWithdrawal.ts:14-67 |
| Image display | revision/bucket/path/version cache key → realtimeToken → authenticated Storage URL → Image.loadAsync; one retry | avatarImages.ts:8-50; Avatar.tsx:43-69 |

## Invariants established by visible code

- iOS credential store is scoped by configured base URL and uses `AfterFirstUnlockThisDeviceOnly`; saving failure throws rather than changing in-memory credentials (`APIClient.swift:15-33`).
- iOS configure/login/logout change authGeneration; RPC checks it before/after its network call, preventing a stale result from being accepted across those changes (`APIClient.swift:17,66,117-122,180`).
- iOS refresh requests are shared via one Task and saved only if the generation still matches (`APIClient.swift:93-102`). JWT/session validity remains server responsibility; `session()` itself checks only local token presence (`APIClient.swift:89,92`).
- OTP link input is limited to the configured service host/path and allowed verification types; returned email must match typed email before iOS saves or Android link flow calls setSession (`APIClient.swift:68-80`; `platformAuth.android.ts:143-174`). Android numeric OTP instead delegates validation/persistence to supabase-js (`:137-141`).
- Session identity changes clear draft/placement/block state and increment a revision; ownProfile and image cache use this revision to partition display results (`sessionState.ts:18-36`; `ownProfile.ts:11-33`; `avatarImages.ts:8-15,37-43`).
- AccountAccess uses a generation guard before committing status; unavailable status is distinct from successful data; refreshed suspension/withdrawal/consent status attempts to stop observation (`useAccountAccess.ts:59-85`).
- iOS route stack is keyed by revision AND access status; Android by revision only (`_layout.tsx:106-111`). Route redirection is presentation gating, not database authorization.
- Client-side image conversion removes metadata before upload and attempts cache-copy removal after conversion/picker use. It does not delete the photo-library original (`avatar.ts:34-96,117-131`).
- Withdrawal retries retain authenticated/confirmed flags in the mounted hook, avoid duplicate calls after known success, and clear them when the ticket expires (`useWithdrawal.ts:11-13,40-63`). Server replay semantics remain a DB dependency.

## Unenforced assumptions / questions for hunting and reset phases

1. **UI identity = signed-in state plus email.** There is no user ID or backend project in sessionState's Session type or changed comparison (`sessionState.ts:7,19-22`). The assumption that different accounts/environments cannot share the same UI identity is established by **nothing found** in this store. Current URL/key values are build-time constants (`native.ts:151-154`), so runtime demo switching must not be assumed implemented.
2. **Environment changes are not a single coordinated operation.** Native configure can replace the Auth backend, while image upload/read URLs remain imported constants (`native.ts:115-123,153-154`; `avatar.ts:117-131`; `avatarImages.ts:31-35`). Android configure creates a new client without visible disposal of the previous client's lifecycle at `platformAuth.android.ts:101-117`. Full environment-switch guarantees are **nothing found** in these paths. This is material to future demo work, not proof of a currently reachable production issue.
3. **Local signed-in state does not prove a live account.** iOS `session()` returns true for any stored access token (`APIClient.swift:92`). The account-access handler calls native.session on `login_required` without clearing credentials (`useAccountAccess.ts:72-75`); other listed auth errors cause logout (`:76-83`). After the proposed server-side reset, exact refresh/RPC error codes and resulting screen require reproduction; no network test was performed here.
4. **Android logout assumes a session exists early in cleanup.** `modeKey` calls attemptKey; attemptKey throws `login_required` if getSession returns no session (`platformAuth.android.ts:19-22,35-36`). Logout awaits that deletion before signOut (`:362-375`). Behavior after remote deletion/expiry needs reproduction. The hook caller awaiting logout publishes signed-out only after success (`native.ts:108-110`).
5. **Same-email reauthentication retains mounted UI on purpose.** `native.ts:89-90` explicitly states withdrawal reauthentication must remain mounted. That couples reset identity assumptions to withdrawal's ticket/flags (`useWithdrawal.ts:11-13,40-48`). Reset/recreate-same-email acceptance should be checked rather than changing revision logic blindly.
6. **Upload and publication are distinct requests.** Avatar path comes from profile_get; Storage upload upserts; profile_avatar_set runs afterward (`avatar.ts:101-106,117-135`). Pool similarly uses prepare/upload/publish (`:137-149`). Atomic visibility, stale-upload ordering and deleted-account rejection are DB/Storage-policy contracts, **nothing found** in the client alone. All-or-nothing behavior cannot be inferred from a successful upload call.
7. **Image retry says fresh token but does not force refresh.** loadAvatar requests realtimeToken again (`avatarImages.ts:28-44`), while iOS token returns an unexpired stored token (`APIClient.swift:95`). Repeated 401/403 handling depends on caller/server state; retry isn't proof of forced renewal.
8. **Memory cache partition is visible; complete disk erasure is not established here.** Image.loadAsync uses cacheKey, and JS maps clear on revision changes, but these paths contain no explicit Expo disk-cache purge (`avatarImages.ts:5-50`). iOS module calls PrivateHTTPCache.prepareOnce and TemporaryImageCleanup.prepareOnce (`PresenceNativeModule.swift:88-89`); implementations and Expo behavior are outside this pass.
9. **Logout local-vs-remote outcome differs.** iOS deletes local Keychain before best-effort push removal/server logout (`APIClient.swift:179-186`), while Android cleanup can reject before signOut (`platformAuth.android.ts:362-376`). Both need reset-specific verification. Keychain delete result is not checked at `APIClient.swift:182`; persistence of a failed delete is an open OS-level question, not demonstrated behavior.

## Follow-up evidence needed

- Isolated account deletion/recreation followed by cold launch and token refresh on iOS/Android; classify exact errors and ability to log in again.
- Logout without a current Auth session on Android; confirm whether early mode-key cleanup throws and how callers recover.
- Delayed image upload/publication during logout/account change and DB withdrawal; inspect server policies and owner checks.
- Cold startup, route gating and cache behavior using the same email on separately configured projects before exposing a review switch.
- All schema/publication conclusions must be reconciled with current deployed DB functions, not only historical migration source.

## Follow-up local reproduction (after context phase)

`node --test tests/audit-android-logout.test.mjs`: 2/2 passed on 2026-11-25. This harness transpiles and invokes the real exported Android `platformAuth.configure` and `platformAuth.logout`, substituting only Supabase client/native/SecureStore dependencies. With `auth.getSession()` returning `{session:null}`, the observed call sequence was configure/createClient → stopObservation → auth.getSession → rejection `login_required`; signOut, RPC cleanup and SecureStore deletion were not reached. A present-session control reached SecureStore mode deletion, get_my_visit, FCM removal and local signOut. This establishes the branch behavior in source with mocks; it does not establish how an actual device's Supabase session changes after server-side reset. No application fix was made. The test deliberately captures current behavior for audit and is not the desired-behavior regression specification.
