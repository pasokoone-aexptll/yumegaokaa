import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native";
import { MapBlurView } from "./MapBlurView.android";

export function ProgressiveBlur({ edge, active = true, intensity = 30 }: {
  edge: "top" | "bottom" | "solid"; intensity?: number; active?: boolean;
}) {
  if (!active) return null;
  if (edge === "top") return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="mapHeaderShade" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#080c14" stopOpacity={0.9} />
          <Stop offset="50%" stopColor="#080c14" stopOpacity={0.78} />
          <Stop offset="100%" stopColor="#080c14" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#mapHeaderShade)" />
    </Svg>
  );
  return <MapBlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />;
}
