import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export function MapEdgeShade({ edge }: { edge: "top" | "bottom" }) {
  const id = `mapShade${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient id={id} x1="0" x2="0" y1="0%" y2="100%">
          <Stop
            offset="0"
            stopColor="#000000"
            stopOpacity={edge === "top" ? 0.63 : 0}
          />
          <Stop
            offset="1"
            stopColor={edge === "top" ? "#000000" : "#242321"}
            stopOpacity={edge === "top" ? 0 : 1}
          />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
