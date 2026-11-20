/** Per-reader retry pacing. Realtime events cannot bypass a failed read's cooldown. */
export class ReadRetry {
  private failures = 0;
  private retryAt = 0;
  constructor(
    private baseMs: number,
    private maximumMs = 60_000,
  ) {}
  canAttempt(now: number, manual = false) {
    return manual || now >= this.retryAt;
  }
  failed(now: number) {
    this.retryAt =
      now +
      Math.min(this.maximumMs, this.baseMs * 2 ** Math.min(this.failures++, 6));
  }
  succeeded() {
    this.failures = 0;
    this.retryAt = 0;
  }
}
