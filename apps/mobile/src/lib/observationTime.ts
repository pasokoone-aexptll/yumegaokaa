// All elapsed values use Android's time since boot, including deep sleep.
export function observationTime(fixElapsed: number, sent: number, received: number, serverTime: string) {
  const server = Date.parse(serverTime);
  const rtt = received - sent;
  const age = received - fixElapsed;
  if (![server, rtt, age].every(Number.isFinite) || fixElapsed <= 0 || fixElapsed > sent ||
      rtt < 0 || rtt > 2000 || age + rtt / 2 > 120000) {
    throw new Error("stale_observation");
  }
  return new Date(server + rtt / 2 - age).toISOString();
}
