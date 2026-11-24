## `uploadImage` in apps/mobile/src/lib/avatar.ts (L117-L135)

**Purpose:** Upload converted JPEG bytes to the configured Supabase Storage bucket/path.

**Inputs & Assumptions:** bucket/path are supplied by chooseAvatar/chooseStreetIcon, using profile_get or street_icon_prepare (L101-L106,L137-L149). File was re-encoded and bounded at L65-L96. Storage authorization is external and not reimplemented here. Assumption that a path belongs to the current account must be established by server policies; nothing found in this function.

**Outputs & Effects:** POSTs stripped JPEG bytes with API key, current bearer token and upsert=true; throws image_upload_failed on fetch rejection/non-2xx. Does not itself call publication RPC, remove uploaded objects on subsequent failure, or attach an idempotency key.

**Block-by-Block:**

```ts
// L118-L120
const body = stripJpegMetadata(await file.arrayBuffer());
const token = await native.realtimeToken();
```

Reads local file, strips metadata, then obtains token. Full stripJpegMetadata internals are outside this pass. Token validation/refresh is performed by native Auth adapter; iOS token refresh is shared and generation-checked (APIClient.swift:93-102).

```ts
// L121-L135
const response = await fetch(url + "/storage/v1/object/" + bucket + "/" + path,
  { method: "POST", headers: { apikey: key, Authorization: "Bearer " + token,
    "Content-Type": "image/jpeg", "x-upsert": "true" }, body });
// network/non-2xx mapped to image_upload_failed
```

URL/key are build-time imports from native.ts:153-154. This request is not inside native APIClient.rpc's generation checks. Client waits for upload success before profile_avatar_set/street_icon_publish; atomic publication, owner checks and competing upload order are server contracts.

**Cross-Function Dependencies:** Called by chooseAvatar and chooseStreetIcon. Used before publication RPC, whose failure leaves cleanup responsibility to server/storage maintenance. Supabase Storage/Fetch are external black boxes in this analysis.

**Open Questions:** Visibility between upload and publication, old-session delayed completion, server-side ownership after withdrawal, and orphan storage cleanup must be reconciled with current DB and tested independently. No production images were read or uploaded.
