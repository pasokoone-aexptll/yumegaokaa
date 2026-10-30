/** Local checks that do not depend on the device clock or server state. */
export function eventInputError(
  starts: string,
  ends: string,
  capacity: string,
): string | null {
  const start = Date.parse(starts);
  const end = Date.parse(ends);
  if (!Number.isFinite(start) || !Number.isFinite(end))
    return "開始と終了の日時を選んでください。";
  if (end <= start) return "終了は開始より後の日時にしてください。";
  if (end - start > 24 * 60 * 60 * 1000)
    return "開催時間は24時間以内にしてください。";
  const count = Number(capacity);
  if (!capacity.trim() || !Number.isInteger(count) || count < 1 || count > 100)
    return "定員は1〜100人で入力してください。";
  return null;
}
