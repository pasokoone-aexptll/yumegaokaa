import NativeMaskedView from "@react-native-masked-view/masked-view";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { Platform, StyleSheet, Text, View, type ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export const pinRed = ["#FE2E31", "#FFABED"] as const;
export const pinBlue = ["#2E7BFE", "#ABC9FF"] as const;
const Mask = NativeMaskedView as unknown as ComponentType<
  ViewProps & {
    maskElement: ReactElement;
    androidRenderingMode?: "software" | "hardware";
  }
>;
function Gradient({ colors }: { colors: readonly [string, string] }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="pinGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#pinGradient)" />
    </Svg>
  );
}
export function PinGradientText({
  children,
  colors = pinBlue,
}: {
  children: string;
  colors?: readonly [string, string];
}) {
  return (
    <Mask
      androidRenderingMode="software"
      maskElement={
        <Text numberOfLines={1} style={[s.text, { color: "black" }]}>
          {children}
        </Text>
      }
    >
      <Text numberOfLines={1} style={[s.text, { opacity: 0 }]}>
        {children}
      </Text>
      <Gradient colors={colors} />
    </Mask>
  );
}
export function PinBubble({ children }: { children: ReactNode }) {
  return (
    <View style={s.bubbleWrapper}>
      <View style={s.bubble}>{children}</View>
      <Svg width={26} height={17} viewBox="0 0 26 17" style={s.tail}>
        <Path d="M0 0H26L5 16Q1 18 1 13V0Z" fill="white" />
      </Svg>
    </View>
  );
}
export function PinCountdown({ children }: { children: string }) {
  return (
    <View style={s.countdown}>
      <Gradient colors={pinRed} />
      <Text style={[s.text, { color: "white" }]}>{children}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  text: {
    fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
    fontSize: 16,
    fontWeight: "600",
  },
  bubbleWrapper: { alignItems: "center", paddingBottom: 17, maxWidth: 240 },
  bubble: {
    backgroundColor: "white",
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  tail: { marginTop: -1 },
  countdown: {
    overflow: "hidden",
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },
});
