import { requireNativeViewManager } from "expo-modules-core";
import { StyleSheet, type ViewProps } from "react-native";
const Backdrop = requireNativeViewManager<ViewProps & { edge: string }>(
  "PresenceNative",
);
/** Continuous blur contribution; UIKit owns the mask on the effect itself. */
export function ProgressiveBlur({
  edge,
}: {
  edge: "top" | "bottom" | "solid";
  intensity?: number;
}) {
  return (
    <Backdrop
      pointerEvents="none"
      edge={edge}
      style={StyleSheet.absoluteFill}
    />
  );
}
