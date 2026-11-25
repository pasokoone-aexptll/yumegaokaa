import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const localEntry = process.env.YUMEGAOKA_LOCAL_ENTRY === "1";
  const validationRelease = process.env.YUMEGAOKA_VALIDATION_RELEASE === "1";
  const storeBuild = process.env.YUMEGAOKA_STORE_BUILD === "1";
  if (storeBuild) {
    if (process.env.EXPO_PUBLIC_REGISTRATION_DECLARATION !== "1")
      throw new Error("Store build requires registration declarations");
    for (const flag of [
      "YUMEGAOKA_LOCAL_ENTRY",
      "YUMEGAOKA_VALIDATION_RELEASE",
      "EXPO_PUBLIC_FIELD_TRIAL",
      "EXPO_PUBLIC_UI_REVIEW",
      "YUMEGAOKA_SIMULATE_READ_OUTAGE",
    ]) {
      if (process.env[flag] === "1")
        throw new Error(`Store build forbids ${flag}`);
    }
    // Require an explicitly selected deployment, rather than accepting whatever
    // development endpoint happens to be in .env.local. Never print credentials.
    const approvedOrigin = process.env.YUMEGAOKA_STORE_API_ORIGIN;
    const apiURL = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!approvedOrigin || !apiURL || apiURL !== approvedOrigin)
      throw new Error("Store build requires an explicit matching API origin");
    const review: typeof import("./review-deployment.json") = require("./review-deployment.json");
    if (apiURL === review.url)
      throw new Error("Store build cannot use the review API for regular accounts");
    const address = new URL(apiURL);
    if (
      address.protocol !== "https:" ||
      address.origin !== apiURL ||
      !/^[a-z0-9-]+\.supabase\.co$/.test(address.hostname)
    )
      throw new Error("Store build requires a hosted Supabase HTTPS origin");
    const publicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    let publicRole = false;
    if (publicKey.startsWith("sb_publishable_")) {
      publicRole = publicKey.length > "sb_publishable_".length;
    } else {
      try {
        const parts = publicKey.split(".");
        publicRole =
          parts.length === 3 &&
          JSON.parse(Buffer.from(parts[1], "base64url").toString()).role ===
            "anon";
      } catch {
        /* Fail closed without logging the key. */
      }
    }
    if (!publicRole)
      throw new Error(
        "Store build requires a publishable or legacy anon key, never a secret key",
      );
    if (
      !process.env.EXPO_PUBLIC_STREET_ID?.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    )
      throw new Error("Store build requires an explicit street ID");
    if (process.env.YUMEGAOKA_APNS_ENVIRONMENT !== "production")
      throw new Error("Store build requires production APNs");
    if (!process.env.APPLE_TEAM_ID?.match(/^[A-Z0-9]{10}$/))
      throw new Error("Store build requires an Apple Team ID");
    const gateway = process.env.EXPO_PUBLIC_GATEWAY_URL;
    if (!gateway) throw new Error("Store build requires a production WSS gateway");
    const endpoint = new URL(gateway);
    if (
      endpoint.protocol !== "wss:" ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    )
      throw new Error("Store build requires a WSS gateway without embedded credentials");
    if (endpoint.hostname.replace(/\.$/, "") === new URL(review.gateway).hostname)
      throw new Error("Store build cannot use the review gateway for regular accounts");
  }
  if (validationRelease) {
    const address = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL ?? "");
    const octets = address.hostname.split(".").map(Number);
    const local =
      address.hostname === "localhost" ||
      (octets.length === 4 &&
        octets.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) &&
        (octets[0] === 127 ||
          octets[0] === 10 ||
          (octets[0] === 192 && octets[1] === 168) ||
          (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)));
    if (
      !localEntry ||
      !local ||
      !["http:", "https:"].includes(address.protocol)
    )
      throw new Error(
        "Validation Release requires local NFC substitution and a local Supabase URL",
      );
  }
  const pushEnvironment = process.env.YUMEGAOKA_APNS_ENVIRONMENT;
  if (pushEnvironment && !["sandbox", "production"].includes(pushEnvironment))
    throw new Error("Invalid APNs environment");
  const entitlements = { ...config.ios?.entitlements };
  if (localEntry)
    delete entitlements["com.apple.developer.nfc.readersession.formats"];
  delete entitlements["aps-environment"];
  if (pushEnvironment)
    entitlements["aps-environment"] =
      pushEnvironment === "sandbox" ? "development" : "production";
  const infoPlist = { ...config.ios?.infoPlist };
  if (storeBuild) {
    delete infoPlist.NSLocalNetworkUsageDescription;
    // No development ATS exceptions in the store configuration.
    delete infoPlist.NSAppTransportSecurity;
  }
  return {
    ...config,
    name: validationRelease
      ? "電信出口 検証用"
      : localEntry
        ? "電信出口 開発用"
        : (config.name ?? "電信出口"),
    slug: "yumegaoka",
    extra: { ...config.extra, localEntry, validationRelease, storeBuild },
    plugins: [
      ...(config.plugins ?? []).filter(
        (plugin) =>
          !localEntry ||
          (Array.isArray(plugin) ? plugin[0] : plugin) !==
            "react-native-nfc-manager",
      ),
      "./plugins/with-android-launch-background",
      "expo-image",
      [
        "expo-camera",
        {
          cameraPermission: "招待QRコードを読み取るためにカメラを使用します。",
          recordAudioAndroid: false,
        },
      ],
      ...(localEntry ? ["./plugins/with-local-entry"] : []),
    ],
    ios: {
      ...config.ios,
      entitlements,
      infoPlist: {
        ...infoPlist,
        CFBundleDisplayName: "電信出口",
        YumegaokaPushEnvironment: pushEnvironment ?? "",
      },
      ...(process.env.APPLE_TEAM_ID
        ? { appleTeamId: process.env.APPLE_TEAM_ID }
        : {}),
    },
  };
};
