const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function gatewayAuthorizer({ apiURL, publishableKey, db, streetId }) {
  if (!uuid.test(streetId)) throw Error("Invalid gateway street configuration");
  return async (token) => {
    // GoTrue validates the signature and expiry. Decoding alone never authorizes.
    const response = await fetch(`${apiURL}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const user = await response.json();
    let claims;
    try {
      claims = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
      );
    } catch {
      return null;
    }
    if (
      claims.sub !== user.id ||
      !uuid.test(user.id) ||
      !uuid.test(claims.session_id ?? "") ||
      claims.role !== "authenticated"
    )
      return null;
    const result = await db.query(
      `select m.account_id
      from app_private.members m join auth.sessions s on s.user_id=m.account_id
      where m.account_id=$1 and s.id=$2 and m.active and m.withdrawn_at is null
      and (s.not_after is null or s.not_after>clock_timestamp())
      and exists(select 1 from app_private.streets where id=$3)`,
      [user.id, claims.session_id, streetId],
    );
    if (!result.rowCount) return null;
    return { accountId: user.id, sessionId: claims.session_id, streetId };
  };
}
