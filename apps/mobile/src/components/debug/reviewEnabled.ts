import { native } from "../../lib/native";
// Opt-in visual review builds only. This does not alter auth, RPC or roles.
export const reviewEnabled =
  process.env.EXPO_PUBLIC_UI_REVIEW === "1" && native.isSimulator?.() === true;
