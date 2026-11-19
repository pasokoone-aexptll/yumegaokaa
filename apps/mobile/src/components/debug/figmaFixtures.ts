import type { DenshinPin } from "../../lib/denshin";
import type { useDenshinDetail } from "../../hooks/useDenshinDetail";
import type { Notice, useNotifications } from "../../hooks/useNotifications";
import type { useEmailChange } from "../../hooks/useEmailChange";
import type { useOperatorDashboard } from "../../hooks/useOperatorDashboard";
export const noop = () => {};
export const done = async () => {};
export const people = [
  "9memem",
  "yuu8",
  "sannlib",
  "anyonyo",
  "chainchainchaon",
  "329memem",
].map((display_name, i) => ({
  account_id: `review-${i}`,
  display_name,
  state: i === 5 ? ("planned" as const) : ("arrived" as const),
}));
export const pin: DenshinPin = {
  id: "review-pin",
  street_id: "",
  author_id: "review-host",
  body: "初めての人も歓迎",
  longitude: 139.71,
  latitude: 35.729,
  recruiting: true,
  capacity: 7,
  host_arrived: false,
  revision: 1,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  mine: false,
  display_name: "nyan_x",
  blocked: false,
  count: 6,
  attendance: "left",
  attendance_revision: 0,
  people,
};
export function pinData(
  value: DenshinPin,
): ReturnType<typeof useDenshinDetail> {
  return {
    pin: value,
    loading: false,
    busy: false,
    ended: false,
    error: "",
    confirmed: false,
    setConfirmed: noop,
    pending: undefined,
    recover: done,
    load: done,
    attend: async () => false,
    mode: async () => false,
    host: async () => false,
    remove: async () => false,
  };
}
const today = new Date();
today.setHours(6, 12, 0, 0);
export const notices: Notice[] = [
  "pin_joined",
  "pin_joined",
  "pin_closed",
  "pin_created",
].map((kind, index) => ({
  id: `review-notice-${index}`,
  event_id: "",
  pin_id: pin.id,
  kind: kind as Notice["kind"],
  title: index < 2 ? pin.body : "明日の20:00ごろから居ます",
  display_name: "nyan_x",
  deleted: kind === "pin_closed",
  created_at: new Date(
    today.getTime() - (index ? 86400000 + index * 1000 : 0),
  ).toISOString(),
  read: false,
}));
export function noticeData(
  items = notices,
): ReturnType<typeof useNotifications> {
  return {
    items,
    error: "",
    loading: false,
    reading: null,
    load: done,
    markRead: async () => true,
  };
}
export function emailData(
  code = "",
  complete = false,
): ReturnType<typeof useEmailChange> {
  return {
    email: "current@example.test",
    pending: "new@example.test",
    next: "",
    completedCode: complete ? code : "",
    verifiedAddress: "",
    oldCode: code,
    newCode: "",
    busy: false,
    status: complete ? "メールアドレスを変更しました" : "",
    loading: false,
    ready: true,
    setNext: noop,
    setOldCode: noop,
    setNewCode: noop,
    load: async () => true,
    send: done,
    verify: done,
  };
}
export const operator: ReturnType<typeof useOperatorDashboard> = {
  operator: true,
  ready: true,
  busy: false,
  error: "",
  factor: "",
  secret: "",
  code: "",
  setCode: noop,
  summary: { active_members: 12, active_invitations: 3 },
  more: false,
  enroll: done,
  verify: done,
  revoke: done,
  refresh: done,
  next: done,
  invites: ["onboarding visitor", null, "onboarding visitor"].map(
    (recipient_name, i) => ({
      id: `review-invite-${i}`,
      issuer_name: "nyanx",
      recipient_name,
      used_at: recipient_name ? new Date().toISOString() : null,
      revoked_at: i === 1 ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      expires_at: pin.expires_at,
    }),
  ),
};
