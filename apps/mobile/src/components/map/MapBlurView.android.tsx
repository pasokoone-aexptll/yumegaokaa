import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

export const MapBlurView = requireNativeViewManager<ViewProps & { tint?: string; intensity?: number }>(
  "PresenceNative", "MapBackdrop",
);
