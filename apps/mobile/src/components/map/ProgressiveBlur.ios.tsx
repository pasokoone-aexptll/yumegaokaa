import { requireNativeViewManager } from "expo-modules-core";
import { StyleSheet, type ViewProps } from "react-native";
const Backdrop = requireNativeViewManager<
  ViewProps & { edge: string; active: boolean }
>("PresenceNative");
/** Continuous blur contribution; UIKit owns the mask on the effect itself. */
export function ProgressiveBlur({
  edge,
  active = true,
}: {
  edge: "top" | "bottom" | "solid";
  intensity?: number;
  active?: boolean;
}) {
  return (
    <Backdrop
      pointerEvents="none"
      edge={edge}
      active={active}
      style={StyleSheet.absoluteFill}
    />
  );
}
