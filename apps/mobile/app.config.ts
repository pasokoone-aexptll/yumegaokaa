import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const localEntry = process.env.YUMEGAOKA_LOCAL_ENTRY === "1";
  const entitlements = { ...config.ios?.entitlements };
  if (localEntry)
    delete entitlements["com.apple.developer.nfc.readersession.formats"];
  return {
    ...config,
    name: localEntry ? "夢ヶ丘 開発用" : (config.name ?? "夢ヶ丘"),
    slug: "yumegaoka",
    extra: { ...config.extra, localEntry },
    plugins: [
      ...(config.plugins ?? []).filter(
        (plugin) =>
          !localEntry ||
          (Array.isArray(plugin) ? plugin[0] : plugin) !==
            "react-native-nfc-manager",
      ),
      ...(localEntry ? ["./plugins/with-local-entry"] : []),
    ],
    ios: {
      ...config.ios,
      entitlements,
      ...(process.env.APPLE_TEAM_ID
        ? { appleTeamId: process.env.APPLE_TEAM_ID }
        : {}),
    },
  };
};
