/** Server rate limits are not connection failures and do not imply an email was sent. */
export function authSendLimit(
  error: unknown,
): { message: string; retryAfterSeconds: number } | null {
  const text = String(error);
  if (/over_email_send_rate_limit|email rate limit exceeded/i.test(text)) {
    return {
      message:
        "認証メールの送信上限に達しました。時間をおいてから、もう一度お試しください。",
      retryAfterSeconds: 60,
    };
  }
  const seconds = text.match(/after\s+(\d+)\s*seconds/i);
  if (seconds) {
    const wait = Math.max(1, Number(seconds[1]));
    return {
      message: `認証メールの再送は${wait}秒後にできます。`,
      retryAfterSeconds: wait,
    };
  }
  if (/over_request_rate_limit|rate limit|too many requests/i.test(text)) {
    return {
      message:
        "短時間に認証のリクエストが集中しています。少し待ってから、もう一度お試しください。",
      retryAfterSeconds: 60,
    };
  }
  return null;
}
