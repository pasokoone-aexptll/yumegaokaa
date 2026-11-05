import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { mapBlur } from "./mapBlur";

// Keep moving map pixels and blur on the hardware compositor.
export function ProgressiveBlur({ edge, intensity = 30, active = true }: {
  edge: "top" | "bottom" | "solid";
  intensity?: number;
  active?: boolean;
}) {
  return active ? <BlurView {...mapBlur} pointerEvents="none" intensity={intensity}
    tint={edge === "solid" ? "dark" : "default"} style={StyleSheet.absoluteFill} /> : null;
}
