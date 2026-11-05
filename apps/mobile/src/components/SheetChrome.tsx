import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
const Backdrop = requireNativeViewManager<ViewProps>("PresenceNative", "SheetBackdrop");
export function SheetChrome() {
  return <Backdrop pointerEvents="none" style={{ position: "absolute", width: 1, height: 1 }} />;
}
