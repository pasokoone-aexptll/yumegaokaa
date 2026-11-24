import { requireNativeViewManager } from "expo-modules-core";
import { StyleSheet, type ViewProps } from "react-native";
const Backdrop = requireNativeViewManager<ViewProps & { light?: boolean }>(
  "PresenceNative",
  "SheetBackdrop",
);
export function SheetSurface({ light = false }: { light?: boolean }) {
  return (
    <Backdrop
      light={light}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    />
  );
}
