export type Attendance = "left" | "planned" | "arrived";
export type PinPerson = {
  account_id: string;
  display_name: string;
  avatar_path?: string;
  state: Attendance;
};
export type DenshinPin = {
  id: string;
  street_id: string;
  author_id: string;
  body: string;
  longitude: number;
  latitude: number;
  recruiting: boolean;
  capacity: number | null;
  host_arrived: boolean;
  revision: number;
  created_at: string;
  expires_at: string;
  mine: boolean;
  display_name: string;
  avatar_path?: string;
  blocked: boolean;
  count: number;
  attendance: Attendance;
  attendance_revision: number;
  people: PinPerson[];
};
export type HiddenAttendance = Pick<
  DenshinPin,
  "id" | "attendance" | "revision" | "attendance_revision" | "expires_at"
>;
export type DenshinList = {
  items: DenshinPin[];
  hidden_attendance: HiddenAttendance[];
  server_time: string;
};
export function pinCount(pin: Pick<DenshinPin, "count" | "capacity">) {
  return pin.capacity === null
    ? `${pin.count}人`
    : `${pin.count}/${pin.capacity}人`;
}
export function denshinError(error: unknown) {
  const text = String(error);
  if (text.includes("daily_limit"))
    return "今日作れる電信PINは3個までです。日本時間0時に枠が戻ります。";
  if (text.includes("active_limit"))
    return "同時に公開できる電信PINは3個までです。";
  if (text.includes("confirmation_required"))
    return "新しく参加した人がいます。送信を取り消して最新の参加者を確認し、募集終了をやり直してください。";
  if (text.includes("full"))
    return "満員になりました。空きができると参加できます。";
  if (text.includes("not_found"))
    return "この電信PINは終了したか、表示できなくなりました。";
  if (text.includes("conflict"))
    return "内容が更新されています。最新の状態を確認して、もう一度操作してください。";
  if (text.includes("participants_present"))
    return "参加者がいるため場所を変更できません。人数上限は参加人数以上にしてください。";
  if (text.includes("posting_restricted"))
    return "現在、投稿が制限されています。";
  if (text.includes("not_recruiting"))
    return "現在は参加を受け付けていません。";
  if (text.includes("invalid_input"))
    return "本文・人数・街の範囲内の場所を確認してください。";
  return "送信結果を確認できません。接続を確認して再試行してください。";
}

export function onsitePeople(pin: DenshinPin): PinPerson[] {
  const people = pin.people.filter(
    (person) =>
      person.state === "arrived" && person.account_id !== pin.author_id,
  );
  return people;
}
