import { reviewVisits } from "./reviewVisit";
import { platformAuth } from "./platformAuth";
import { sessionState } from "./sessionState";
import { requireNativeModule } from "expo-modules-core";
export type Visit = {
  visit_id: string;
  street_id: string;
  state: "active" | "ended" | "expired";
  can_update: boolean;
  expires_at: string;
  last_seq: string;
  ghost?: boolean;
  mode_revision?: string;
};
export type NativeState = {
  observing: boolean;
  status: string;
  pending_exit: boolean;
  ghost_preference?: boolean;
  pending_mode?: "" | "ghost" | "public";
  visit: Partial<Visit>;
};
export type Snapshot = {
  server_time: string;
  checked_in_count: number;
  checked_in_icon_groups?: { expires_at: string; icons: (string | null)[] }[];
  presence_count: number;
  cells: {
    cell_id: string;
    area_version: string;
    grid_version: string;
    anchor: { longitude: number; latitude: number };
    expiry_groups: {
      expires_at: string;
      count: number;
      icons?: (string | null)[];
    }[];
  }[];
};
const bridge = requireNativeModule("PresenceNative") as {
  isSimulator?(): boolean;
  pushSync(request: boolean): Promise<string>;
  pushStatus(): Promise<string>;
  pushOpen(): Promise<boolean>;
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
  reviewPassword(email: string, password: string): Promise<void>;
  session(): Promise<{ signed_in: boolean; email: string }>;
  sendOTP(email: string, createAccount?: boolean): Promise<void>;
  verifyOTP(email: string, code: string): Promise<unknown>;
  rpc<T>(operation: string, payload: Record<string, unknown>): Promise<T>;
  checkin(tag: string): Promise<NativeState>;
  setGhost(ghost: boolean): Promise<NativeState>;
  stop(visitId?: string): Promise<NativeState>;
  resume(): Promise<NativeState>;
  logout(): Promise<void>;
  addListener(
    event: "onChange",
    listener: (state: NativeState) => void,
  ): { remove(): void };
};
const auth = platformAuth ?? bridge;
/** A real verified session may finish its success presentation before routing. */
export async function verifyLoginOTP(
  email: string,
  code: string,
  onVerified: () => Promise<void>,
) {
  await auth.verifyOTP(email, code);
  await onVerified();
  await session();
}
// Reset mounted screens when the local identity changes. Same-account OTP
// reauthentication (for withdrawal) must keep its current operation alive.
const session = async () => {
  const result = await auth.session();
  sessionState.publish(result);
  return result;
};
const authMethods = {
  session,
  async verifyOTP(email: string, code: string) {
    const result = await auth.verifyOTP(email, code);
    await session();
    return result;
  },
  async verifyEmailChange(email: string, code: string) {
    const result = await auth.verifyEmailChange(email, code);
    if (result.complete) await session();
    return result;
  },
  async logout() {
    if (inReview()) await demoVisits.stop().catch(() => {});
    await auth.logout();
    if (inReview()) await selectDeployment(production);
    sessionState.publish({ signed_in: false, email: "" });
  },
};
let configuration:
  { url: string; key: string; promise: Promise<void> } | undefined;
function configure(url: string, key: string) {
  if (configuration?.url === url && configuration.key === key)
    return configuration.promise;
  const promise = auth.configure(url, key).catch((error) => {
    if (configuration?.promise === promise) configuration = undefined;
    throw error;
  });
  configuration = { url, key, promise };
  return promise;
}
const demoVisits = reviewVisits((operation, payload = {}) => {
  if (!inReview()) throw Error("review_environment_required");
  return auth.rpc(operation, payload);
});
export const native: typeof bridge = {
  isSimulator: () => bridge.isSimulator?.() ?? false,
  ...authMethods,
  reviewPassword: (email, password) => bridge.reviewPassword(email, password),
  pushSync: (request) => inReview() ? Promise.resolve("unavailable") : auth.pushSync(request),
  pushStatus: async () => auth.pushStatus(),
  pushOpen: async () => !inReview() && bridge.pushOpen(),
  currentLocation: () => inReview() ? Promise.resolve({ longitude: 139.8333333, latitude: 36, accuracy: 5, observed_at: Date.now() }) : auth.currentLocation(),
  monotonicTime: () => bridge.monotonicTime(),
  realtimeToken: () => auth.realtimeToken(),
  accountDetails: () => auth.accountDetails(),
  changeEmail: (email) => auth.changeEmail(email),
  mfaFactors: () => auth.mfaFactors(),
  mfaEnroll: () => auth.mfaEnroll(),
  mfaVerify: (factor, code) => auth.mfaVerify(factor, code),
  configure,
  sendOTP: (email, createAccount = true) => auth.sendOTP(email, createAccount),
  rpc: (operation, payload) => auth.rpc(operation, payload),
  checkin: (tag) =>
    inReview() ? demoVisits.enter() : platformAuth ? platformAuth.checkin(tag) : bridge.checkin(tag),
  setGhost: (ghost) =>
    inReview() ? demoVisits.ghost(ghost) : platformAuth ? platformAuth.setGhost(ghost) : bridge.setGhost(ghost),
  stop: (visitId) =>
    inReview() ? demoVisits.stop() : platformAuth ? platformAuth.stop(visitId) : bridge.stop(),
  resume: () => inReview() ? demoVisits.state() : auth.resume(),
  addListener: (event, listener) => bridge.addListener(event, listener),
};
const production = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  streetID: process.env.EXPO_PUBLIC_STREET_ID ?? "11111111-1111-4111-8111-111111111111",
  gateway: process.env.EXPO_PUBLIC_GATEWAY_URL,
};
const review = {
  url: "https://eyrdviyebyozsaellopr.supabase.co",
  key: "sb_publishable_0T5I4TG5sI_9FJtvq8q7TQ_1zEIVWGO",
  streetID: "22222222-2222-4222-8222-222222222222",
  gateway: "wss://denshin-app-review.onrender.com/street",
};
export let { url, key, streetID, gateway } = production;
export const inReview = () => url === review.url;

async function selectDeployment(target: typeof production) {
  await configure(target.url, target.key);
  ({ url, key, streetID, gateway } = target);
}

export async function loginForReview(email: string, password: string) {
  if (platformAuth || (await auth.session()).signed_in) throw Error("logout_required");
  await selectDeployment(review);
  try {
    await bridge.reviewPassword(email, password);
    await session();
  } catch (error) {
    await selectDeployment(production);
    throw error;
  }
}

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
