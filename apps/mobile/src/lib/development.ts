import Constants from "expo-constants";
import { url } from "./native";
// Fixture entry is restricted to a debug build explicitly configured for a local API.
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
export const nfcDisabled = Constants.expoConfig?.extra?.localEntry === true;
export const localEntry = __DEV__ && nfcDisabled && localHost;
