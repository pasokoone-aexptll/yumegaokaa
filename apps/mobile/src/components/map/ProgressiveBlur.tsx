import { BlurView } from "expo-blur";
import NativeMaskedView from "@react-native-masked-view/masked-view";
import type { ComponentType, ReactElement } from "react";
import { StyleSheet, type ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
const Mask = NativeMaskedView as unknown as ComponentType<
  ViewProps & {
    maskElement: ReactElement;
    androidRenderingMode?: "software" | "hardware";
  }
>;
/** Smooth alpha blend into a single blur surface; no discrete blur-radius bands. */
export function ProgressiveBlur({
  edge,
  intensity = 30,
}: {
  edge: "top" | "bottom" | "solid";
  intensity?: number;
}) {
  if (edge === "solid")
    return (
      <BlurView
        pointerEvents="none"
        tint="dark"
        intensity={intensity}
        style={StyleSheet.absoluteFill}
      />
    );
  return (
    <Mask
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      androidRenderingMode="software"
      maskElement={
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient
              id="blurAlpha"
              x1="0"
              x2="0"
              y1={edge === "bottom" ? "0%" : "100%"}
              y2={edge === "bottom" ? "100%" : "0%"}
            >
              <Stop offset="0" stopColor="white" stopOpacity={0} />
              <Stop offset="0.5" stopColor="white" stopOpacity={0.25} />
              <Stop offset="1" stopColor="white" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#blurAlpha)" />
        </Svg>
      }
    >
      <BlurView
        tint="default"
        intensity={intensity}
        style={StyleSheet.absoluteFill}
      />
    </Mask>
  );
}
