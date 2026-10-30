import { sessionState } from "./sessionState";
import { requireNativeModule } from "expo-modules-core";
export type Visit = {
  visit_id: string;
  street_id: string;
  state: "active" | "ended" | "expired";
  can_update: boolean;
  expires_at: string;
  last_seq: string;
};
export type NativeState = {
  observing: boolean;
  status: string;
  pending_exit: boolean;
  visit: Partial<Visit>;
};
export type Snapshot = {
  server_time: string;
  checked_in_count: number;
  presence_count: number;
  cells: {
    cell_id: string;
    area_version: string;
    grid_version: string;
    anchor: { longitude: number; latitude: number };
    expiry_groups: { expires_at: string; count: number }[];
  }[];
};
const bridge = requireNativeModule("PresenceNative") as {
  currentLocation(): Promise<{
    longitude: number;
    latitude: number;
    accuracy: number;
    observed_at: number;
  }>;
  monotonicTime(): number;
  realtimeToken(): Promise<string>;
  accountDetails(): Promise<{ email: string; new_email: string }>;
  changeEmail(email: string): Promise<void>;
  verifyEmailChange(
    email: string,
    code: string,
  ): Promise<{ complete: boolean }>;
  mfaFactors(): Promise<{
    factors: { id: string; status: string; factor_type: string }[];
  }>;
  mfaEnroll(): Promise<{ id: string; totp: { secret: string; uri: string } }>;
  mfaVerify(factor: string, code: string): Promise<void>;
  configure(url: string, key: string): Promise<void>;
  session(): Promise<{ signed_in: boolean; email: string }>;
  sendOTP(email: string): Promise<void>;
  verifyOTP(email: string, code: string): Promise<unknown>;
  rpc<T>(operation: string, payload: Record<string, unknown>): Promise<T>;
  checkin(tag: string): Promise<NativeState>;
  stop(): Promise<NativeState>;
  resume(): Promise<NativeState>;
  logout(): Promise<void>;
  addListener(
    event: "onChange",
    listener: (state: NativeState) => void,
  ): { remove(): void };
};
// Reset mounted screens when the local identity changes. Same-account OTP
// reauthentication (for withdrawal) must keep its current operation alive.
const session = async () => {
  const result = await bridge.session();
  sessionState.publish(result);
  return result;
};
const authMethods = {
  session,
  async verifyOTP(email: string, code: string) {
    const result = await bridge.verifyOTP(email, code);
    await session();
    return result;
  },
  async verifyEmailChange(email: string, code: string) {
    const result = await bridge.verifyEmailChange(email, code);
    if (result.complete) await session();
    return result;
  },
  async logout() {
    await bridge.logout();
    sessionState.publish({ signed_in: false, email: "" });
  },
};
export const native: typeof bridge = {
  ...authMethods,
  currentLocation: () => bridge.currentLocation(),
  monotonicTime: () => bridge.monotonicTime(),
  realtimeToken: () => bridge.realtimeToken(),
  accountDetails: () => bridge.accountDetails(),
  changeEmail: (email) => bridge.changeEmail(email),
  mfaFactors: () => bridge.mfaFactors(),
  mfaEnroll: () => bridge.mfaEnroll(),
  mfaVerify: (factor, code) => bridge.mfaVerify(factor, code),
  configure: (url, key) => bridge.configure(url, key),
  sendOTP: (email) => bridge.sendOTP(email),
  rpc: (operation, payload) => bridge.rpc(operation, payload),
  checkin: (tag) => bridge.checkin(tag),
  stop: () => bridge.stop(),
  resume: () => bridge.resume(),
  addListener: (event, listener) => bridge.addListener(event, listener),
};
export const streetID =
  process.env.EXPO_PUBLIC_STREET_ID ?? "11111111-1111-4111-8111-111111111111";
export const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export async function displayClock() {
  let best: { server: number; local: number; rtt: number } | undefined;
  for (let i = 0; i < 3; i++) {
    const start = native.monotonicTime();
    const result = await native.rpc<{ server_time: string }>("time", {});
    const end = native.monotonicTime(),
      rtt = end - start;
    if (rtt <= 2000 && (!best || rtt < best.rtt))
      best = {
        server: Date.parse(result.server_time) + rtt / 2,
        local: end,
        rtt,
      };
  }
  if (!best) throw new Error("clock_sync_failed");
  return best;
}
