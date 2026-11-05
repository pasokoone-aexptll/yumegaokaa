// A retry must reuse the original request ID, mode revision, visit and observation.
// The server checks idempotency before revision and observation freshness.
export async function deliverMode(
  payload: Record<string, unknown>,
  send: (payload: Record<string, unknown>) => Promise<unknown>,
  forget: () => Promise<void>,
) {
  try {
    await send(payload);
  } catch (error) {
    if (/\b(conflict|wrong_writer|inactive_visit|stale_observation|invalid_accuracy|invalid_cell|area_changed|membership_required|unauthorized)\b/.test(String(error))) {
      await forget();
    }
    throw error;
  }
  await forget();
}
