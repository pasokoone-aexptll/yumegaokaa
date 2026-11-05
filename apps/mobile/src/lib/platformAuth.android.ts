import { PermissionsAndroid, Platform } from "react-native";
import { deliverMode } from "./modeDelivery";
import { insideCell, projectStreetPoint } from "./streetGrid";
import { uuid, requireNativeModule } from "expo-modules-core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { NativeState } from "./native";

const push = requireNativeModule<{ pushAllowed(): Promise<boolean>; pushToken(): Promise<string> }>("PresenceNative");
let registration = "";
let visitQueue: Promise<unknown> = Promise.resolve();
function visitOperation<T>(operation: () => Promise<T>): Promise<T> {
  const next = visitQueue.then(operation, operation);
  visitQueue = next.catch(() => {});
  return next;
}
async function attemptKey() {
  const { session } = unwrap(await client.auth.getSession());
  if (!session) throw new Error("login_required");
  return "yumegaoka.attempt." + new URL(origin).hostname + "." + session.user.id;
}
let client: SupabaseClient;
let origin: string;
let publishableKey: string;

function unwrap<T extends { data: unknown; error: { message: string } | null }>(
  result: T,
): T["data"] {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function modeKey() {
  return (await attemptKey()) + ".mode";
}

function sendStoredMode(key: string, payload: Record<string, unknown>) {
  return deliverMode(payload, p => platformAuth.rpc("set_presence_mode", p), () => SecureStore.deleteItemAsync(key));
}

async function readVisitState(): Promise<NativeState> {
  const { visit, ghost_preference } = await platformAuth.rpc<{
    visit: NativeState["visit"] | null;
    ghost_preference: boolean;
  }>("get_my_visit");
  return {
    visit: visit ?? {},
    ghost_preference,
    pending_exit: false,
    observing: false,
    status: visit?.state === "active" ? "参加中" : "未参加",
  };
}

export const platformAuth = {
  async configure(url: string, key: string) {
    origin = new URL(url).origin;
    publishableKey = key;
    client = createClient(url, key, {
      auth: {
        storageKey:
          "yumegaoka.session." + encodeURIComponent(origin).replace(/%/g, "_"),
        storage: {
          getItem: SecureStore.getItemAsync,
          setItem: SecureStore.setItemAsync,
          removeItem: SecureStore.deleteItemAsync,
        },
        detectSessionInUrl: false,
        persistSession: true,
      },
    });
  },
  async session() {
    const { session } = unwrap(await client.auth.getSession());
    return { signed_in: !!session, email: session?.user.email ?? "" };
  },
  async currentLocation() {
    const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
    const permissions = await PermissionsAndroid.requestMultiple([fine, coarse]);
    if (permissions[fine] !== "granted" && permissions[coarse] !== "granted") {
      throw new Error("location_permission_required");
    }
    return requireNativeModule<{
      currentLocation(): Promise<{ longitude: number; latitude: number; accuracy: number; observed_at: number }>;
    }>("PresenceNative").currentLocation();
  },
  async sendOTP(email: string) {
    const { error } = await client.auth.signInWithOtp({ email });
    if (error) throw new Error(error.code ?? error.message);
  },
  async verifyOTP(email: string, code: string) {
    if (!code.startsWith("https://")) {
      const { error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw new Error(error.code ?? error.message);
      return;
    }
    const link = new URL(code);
    const token = link.searchParams.get("token");
    const type = link.searchParams.get("type");
    if (
      link.origin !== origin ||
      link.username ||
      link.password ||
      link.pathname !== "/auth/v1/verify" ||
      !token ||
      !["signup", "magiclink", "email"].includes(type ?? "")
    )
      throw new Error("invalid_input");
    // Verify without persisting until the returned identity matches the entered address.
    const response = await fetch(origin + "/auth/v1/verify", {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ type, token_hash: token }),
    });
    if (!response.ok) throw new Error("invalid_input");
    const result = await response.json();
    if (
      result.user?.email?.toLowerCase() !== email.toLowerCase() ||
      !result.access_token ||
      !result.refresh_token
    )
      throw new Error("login_required");
    unwrap(
      await client.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      }),
    );
  },
  async accountDetails() {
    const { user } = unwrap(await client.auth.getUser());
    if (!user) throw new Error("login_required");
    return { email: user.email ?? "", new_email: user.new_email ?? "" };
  },
  async changeEmail(email: string) {
    unwrap(await client.auth.updateUser({ email }));
  },
  async verifyEmailChange(email: string, code: string) {
    const { session } = unwrap(await client.auth.getSession());
    if (!session) throw new Error("login_required");
    const response = await fetch(origin + "/auth/v1/verify", {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: code, type: "email_change" }),
    });
    if (!response.ok) throw new Error("invalid_input");
    const result = await response.json();
    if (!result.access_token) return { complete: false };
    if (result.user?.id !== session.user.id || !result.refresh_token ||
        unwrap(await client.auth.getSession()).session?.user.id !== session.user.id)
      throw new Error("unauthorized");
    unwrap(await client.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token }));
    return { complete: true };
  },
  async mfaFactors() {
    const result = unwrap(await client.auth.mfa.listFactors());
    if (!result) throw new Error("login_required");
    return { factors: result.all };
  },
  async mfaEnroll() {
    const result = unwrap(await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Yumegaoka operator" }));
    if (!result) throw new Error("invalid_response");
    return { id: result.id, totp: result.totp };
  },
  async mfaVerify(factor: string, code: string) {
    unwrap(await client.auth.mfa.challengeAndVerify({ factorId: factor, code }));
  },
  async pushStatus() {
    if (!await push.pushAllowed()) return "denied";
    return registration ? "registered" : "disabled";
  },
  async pushSync(request: boolean) {
    if (request && Number(Platform.Version) >= 33 && !await push.pushAllowed()) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    if (!await push.pushAllowed()) { registration = ""; return "denied"; }
    const session = unwrap(await client.auth.getSession()).session;
    if (!session) { registration = ""; return "disabled"; }
    const token = await push.pushToken();
    const identity = session.access_token + ":" + token;
    if (registration !== identity) {
      unwrap(await client.rpc("fcm_registration", { operation: "register", payload: { environment: "fcm", token } }));
      registration = identity;
    }
    return "registered";
  },
  async realtimeToken() {
    const { session } = unwrap(await client.auth.getSession());
    if (!session) throw new Error("login_required");
    return session.access_token;
  },
  async rpc<T>(
    operation: string,
    payload: Record<string, unknown> = {},
  ): Promise<T> {
    return unwrap(await client.rpc("street_api", { operation, payload })) as T;
  },
  checkin(tag: string) {
    return visitOperation(async () => {
      const key = await attemptKey();
      let attempt = await SecureStore.getItemAsync(key);
      if (attempt) {
        try {
          const previous = await platformAuth.rpc<{ result: string; visit?: { state?: string; can_update?: boolean } }>("get_checkin_result", { attempt_id: attempt });
          if (previous.result !== "pending") {
            await SecureStore.deleteItemAsync(key);
            attempt = null;
            if (previous.visit?.state === "active" && previous.visit.can_update)
              return readVisitState();
          }
        } catch (error) {
          if (!String(error).includes("not_found")) throw error;
          await SecureStore.deleteItemAsync(key);
          attempt = null;
        }
      }
      if (!attempt) {
        const prepared = await platformAuth.rpc<{ attempt_id: string }>("prepare_checkin", { tag_id: tag, payload_version: 1 });
        attempt = prepared.attempt_id;
        await SecureStore.setItemAsync(key, attempt);
      }
      try {
        const result = await platformAuth.rpc<{ visit?: { state?: string; can_update?: boolean } }>("commit_checkin", { attempt_id: attempt });
        if (result.visit?.state !== "active" || !result.visit.can_update) throw new Error("attempt_expired");
      } catch (error) {
        if (/attempt_expired|tag_changed|conflict|inactive_tag|not_found/.test(String(error)))
          await SecureStore.deleteItemAsync(key);
        throw error;
      }
      await SecureStore.deleteItemAsync(key);
      return readVisitState();
    });
  },
  setGhost(ghost: boolean) {
    return visitOperation(async () => {
      // A newer explicit choice supersedes a pending retry, even if already at the desired state.
      const key = await modeKey();
      const saved = await SecureStore.getItemAsync(key);
      if (saved) {
        const previous = JSON.parse(saved);
        if (previous.ghost === ghost) {
          await sendStoredMode(key, previous);
          return readVisitState();
        }
        await SecureStore.deleteItemAsync(key);
      }
      const current = await platformAuth.rpc<{
        visit: NativeState["visit"] | null; mode_revision: string; ghost_preference: boolean;
      }>("get_my_visit");
      const visit = current.visit?.state === "active" ? current.visit : null;
      if (visit && !visit.can_update) throw new Error("wrong_writer");
      if (current.ghost_preference === ghost && (!visit || visit.ghost === ghost)) return readVisitState();
      const payload: Record<string, unknown> = { ghost, request_id: uuid.v4(), mode_revision: current.mode_revision };
      if (visit) payload.visit_id = visit.visit_id;
      if (visit && !ghost) {
        const fix = await platformAuth.currentLocation();
        const before = performance.now();
        const config = await platformAuth.rpc<{
          polygon: { type: string; coordinates: number[][][] }; area_version: string; grid_version: string; server_time: string;
        }>("get_street_config", { street_id: visit.street_id });
        const rtt = performance.now()-before;
        const age = Date.now()-fix.observed_at;
        if (rtt > 2000 || age < 0 || age+rtt/2 > 120000) throw new Error("stale_observation");
        const cell = config.polygon?.type === "Polygon" &&
          insideCell(projectStreetPoint(fix.longitude, fix.latitude), config.polygon.coordinates, fix.accuracy);
        if (!cell) throw new Error("inside_fix_required");
        Object.assign(payload, {
          seq: (BigInt(visit.last_seq ?? "0")+1n).toString(), area_version: config.area_version,
          grid_version: config.grid_version, cell_id: cell, verdict: "inside",
          horizontal_accuracy_m: fix.accuracy, observed_at: new Date(Date.parse(config.server_time)+rtt/2-age).toISOString(),
        });
      }
      await SecureStore.setItemAsync(key, JSON.stringify(payload));
      await sendStoredMode(key, payload);
      return readVisitState();
    });
  },
  stop() {
    return visitOperation(async () => {
      await SecureStore.deleteItemAsync(await modeKey());
      const key = await attemptKey();
      const attempt = await SecureStore.getItemAsync(key);
      if (attempt) {
        await platformAuth.rpc("cancel_checkin", { attempt_id: attempt }).catch(error => {
          if (!String(error).includes("not_found")) throw error;
        });
        await SecureStore.deleteItemAsync(key);
      }
      const { visit } = await readVisitState();
      if (visit.state === "active" && visit.can_update)
        await platformAuth.rpc("end_visit", { visit_id: visit.visit_id, reason: "manual" });
      return readVisitState();
    });
  },
  async resume(): Promise<NativeState> {
    return visitOperation(async () => {
      const key = await modeKey();
      const saved = await SecureStore.getItemAsync(key);
      if (saved) {
        try { await sendStoredMode(key, JSON.parse(saved)); }
        catch (error) {
          if (await SecureStore.getItemAsync(key)) throw error;
          // Terminal rejection (expired fix / another writer): show the server's state.
        }
      }
      return readVisitState();
    });
  },
  async logout() {
    await visitOperation(async () => SecureStore.deleteItemAsync(await modeKey()));
    const current = await readVisitState().catch(() => null);
    const visit = current?.visit;
    if (visit?.state === "active" && visit.can_update) {
      await platformAuth.rpc("end_visit", {
        visit_id: visit.visit_id,
        reason: "logout",
      }).catch(() => {});
    }
    registration = "";
    await client.rpc("fcm_registration", { operation: "remove" });
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error && (await platformAuth.session()).signed_in) throw new Error(error.message);
  },
};
