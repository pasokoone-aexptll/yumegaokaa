import { PermissionsAndroid, Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { NativeState } from "./native";

const push = requireNativeModule<{ pushAllowed(): Promise<boolean>; pushToken(): Promise<string> }>("PresenceNative");
let registration = "";
let client: SupabaseClient;
let origin: string;
let publishableKey: string;

function unwrap<T extends { data: unknown; error: { message: string } | null }>(
  result: T,
): T["data"] {
  if (result.error) throw new Error(result.error.message);
  return result.data;
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
  async resume(): Promise<NativeState> {
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
  },
  async logout() {
    const current = await platformAuth.resume().catch(() => null);
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
