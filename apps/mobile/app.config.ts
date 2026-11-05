import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const localEntry = process.env.YUMEGAOKA_LOCAL_ENTRY === "1";
  const validationRelease = process.env.YUMEGAOKA_VALIDATION_RELEASE === "1";
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
  return {
    ...config,
    name: validationRelease
      ? "夢ヶ丘 検証用"
      : localEntry
        ? "夢ヶ丘 開発用"
        : (config.name ?? "夢ヶ丘"),
    slug: "yumegaoka",
    extra: { ...config.extra, localEntry, validationRelease },
    plugins: [
      ...(config.plugins ?? []).filter(
        (plugin) =>
          !localEntry ||
          (Array.isArray(plugin) ? plugin[0] : plugin) !==
            "react-native-nfc-manager",
      ),
      "./plugins/with-android-launch-background",
      ...(localEntry ? ["./plugins/with-local-entry"] : []),
    ],
    ios: {
      ...config.ios,
      entitlements,
      infoPlist: {
        ...config.ios?.infoPlist,
        CFBundleDisplayName: "夢ヶ丘",
        YumegaokaPushEnvironment: pushEnvironment ?? "",
      },
      ...(process.env.APPLE_TEAM_ID
        ? { appleTeamId: process.env.APPLE_TEAM_ID }
        : {}),
    },
  };
};
