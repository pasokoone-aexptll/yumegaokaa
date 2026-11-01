// At-least-once delivery: APNs acceptance followed by a lost DB response can
// resend. A stable apns-id/collapse-id limits visible duplication, not guarantees it.
export async function deliverPush(
  rpc,
  sender,
  { environment, limit = 100 } = {},
) {
  const totals = { accepted: 0, retry: 0, invalid: 0, failed: 0 };
  for (let i = 0; i < limit; i++) {
    const item = await rpc("claim", { environment });
    if (!item.active) break;
    const receipt = {
      id: item.id,
      device_id: item.device_id,
      lease: item.lease,
    };
    try {
      const current = await rpc("recheck", receipt);
      if (!current.active) continue;
      const result = await sender.send(current);
      if (result.kind === "configuration_error") {
        await rpc("retry", receipt);
        throw Error("apns_configuration_error");
      }
      await rpc(result.kind, {
        ...receipt,
        registered_at: current.registered_at,
        ...(result.invalidated_at
          ? { invalidated_at: result.invalidated_at }
          : {}),
      });
      if (result.kind === "invalid_token") totals.invalid++;
      else totals[result.kind]++;
    } catch (error) {
      if (error.message === "apns_configuration_error") throw error;
      await rpc("retry", receipt);
      totals.retry++;
    }
  }
  return totals;
}
