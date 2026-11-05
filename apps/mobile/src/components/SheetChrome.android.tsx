import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
const Handle = requireNativeViewManager<ViewProps>("PresenceNative", "SheetHandle");

export function SheetChrome() {
  return <Handle style={{ height: 28, width: "100%" }} />;
}
