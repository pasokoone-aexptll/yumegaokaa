import { Platform } from "react-native";
import Constants from "expo-constants";
import { url } from "./native";
// Fixture entry requires an explicit local configuration, including in validation Release builds.
export const localHost = (() => {
  try {
    const h = new URL(url).hostname;
    if (h === "localhost") return true;
    const octets = h.split(".");
    if (
      octets.length !== 4 ||
      octets.some((x) => !/^\d{1,3}$/.test(x) || Number(x) > 255)
    )
      return false;
    const [first, second] = octets.map(Number);
    return (
      first === 127 ||
      first === 10 ||
      (first === 192 && second === 168) ||
      (first === 172 && second >= 16 && second <= 31)
    );
  } catch {
    return false;
  }
})();
const localEntryConfigured = Constants.expoConfig?.extra?.localEntry === true;
export const nfcDisabled = Platform.OS === "ios" && localEntryConfigured;
const validationRelease =
  Constants.expoConfig?.extra?.validationRelease === true;
export const localEntry =
  (__DEV__ || validationRelease) && localEntryConfigured && localHost;

// Only this project's server provisions the account-bound trial tag.
export const fieldTrial = url === "https://kchsbjayfdwjjbevqlop.supabase.co" &&
  process.env.EXPO_PUBLIC_FIELD_TRIAL === "1";
