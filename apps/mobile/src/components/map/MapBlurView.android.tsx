import { View, type ViewProps } from "react-native";

export function MapBlurView({ tint, intensity = 30, style, ...props }: ViewProps & {
  tint?: string; intensity?: number;
}) {
  const alpha = Math.min(0.65, intensity / 140);
  const color = tint === "light" ? "255,255,255" : "17,20,28";
  return <View {...props} pointerEvents="none" style={[style, {
    experimental_backgroundImage: `linear-gradient(180deg, rgba(${color},${alpha * 0.35}), rgba(${color},${alpha}))`,
  }]} />;
}
