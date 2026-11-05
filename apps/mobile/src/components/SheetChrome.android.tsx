import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
const Handle = requireNativeViewManager<ViewProps & { expanded?: boolean }>("PresenceNative", "SheetHandle");

export function SheetChrome({ expanded }: { expanded?: boolean }) {
  return <Handle expanded={expanded} style={{ height: 28, width: "100%" }} />;
}
