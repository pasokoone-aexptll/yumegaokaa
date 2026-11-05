import { StyleSheet } from "react-native";
import { MapBlurView } from "./MapBlurView.android";

export function ProgressiveBlur({ active = true, intensity = 30 }: {
  edge: "top" | "bottom" | "solid"; intensity?: number; active?: boolean;
}) {
  return active ? <MapBlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} /> : null;
}
