// Transport-independent loop. Production APNs is deliberately not implemented here.
export async function simulateNotifications(rpc, limit = 100) {
  let simulated = 0;
  for (let index = 0; index < limit; index++) {
    const item = await rpc("claim");
    if (!item.active) break;
    const receipt = { id: item.id, lease: item.lease };
    try {
      const current = await rpc("recheck", receipt);
      if (!current.active) continue;
      const result = await rpc("simulate", receipt);
      if (result.simulated) simulated++;
    } catch {
      await rpc("retry", receipt);
    }
  }
  return simulated;
}
