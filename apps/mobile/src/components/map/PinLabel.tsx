import NativeMaskedView from "@react-native-masked-view/masked-view";
import { RefreshMarker } from "./markerScale";
import { useContext, useState, useId } from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { Image, Platform, StyleSheet, Text, View, type ViewProps } from "react-native";
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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const id = `pinGradient${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={StyleSheet.absoluteFill}
      onLayout={({ nativeEvent: { layout } }) =>
        setSize({ width: layout.width, height: layout.height })
      }
    >
      {size.width > 0 && size.height > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
        >
          <Defs>
            <LinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
}
export function PinGradientText({
  children,
  colors = pinBlue,
}: {
  children: string;
  colors?: readonly [string, string];
}) {
  if (Platform.OS === "android") return <Text numberOfLines={1} style={[s.text, { color: colors[0] }]}>{children}</Text>;
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
// Map annotations are snapshotted on both platforms. Keep the shadow pixels
// inside the snapshot, outside the clipped pill and its text.
function LabelShadow({ bubble = false, children }: { bubble?: boolean; children: ReactNode }) {
  const refresh = useContext(RefreshMarker);
  const shadow = Platform.OS === "ios"
    ? (bubble ? require("../../../assets/map-markers/bubble-shadow-ios.png") : require("../../../assets/map-markers/countdown-shadow-ios.png"))
    : (bubble ? require("../../../assets/map-markers/bubble-shadow.png") : require("../../../assets/map-markers/countdown-shadow.png"));
  return (
    <View collapsable={false} style={s.shadowFrame}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image accessible={false} resizeMode="stretch" fadeDuration={0}
          onLoadEnd={refresh}
          source={shadow}
          style={{ width: "100%", height: "100%" }} />
      </View>
      {children}
    </View>
  );
}

export function PinBubble({ children }: { children: ReactNode }) {
  return (
    <LabelShadow bubble>
      <View style={s.bubbleWrapper}>
        <View style={s.bubble}>{children}</View>
        <Svg width={20.8} height={13.6} viewBox="0 0 26 17" style={s.tail}>
          <Path d="M0 0H26L5 16Q1 18 1 13V0Z" fill="white" />
        </Svg>
      </View>
    </LabelShadow>
  );
}

export function PinCountdown({ children }: { children: string }) {
  return (
    <LabelShadow>
      <View collapsable={false} style={[s.countdown, Platform.OS === "android" && {
        experimental_backgroundImage: "linear-gradient(180deg, #FE2E31, #FFABED)",
      }]}>
        {Platform.OS !== "android" && <Gradient colors={pinRed} />}
        <Text numberOfLines={1} style={[s.text, { color: "white", includeFontPadding: false }]}>{children}</Text>
      </View>
    </LabelShadow>
  );
}
const s = StyleSheet.create({
  text: {
    fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
    fontSize: 14.4,
    fontWeight: "600",
  },
  shadowFrame: { paddingHorizontal: 8, paddingVertical: 7, alignSelf: "center", maxWidth: "100%" },
  bubbleWrapper: { alignItems: "center", maxWidth: 240 },
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
    flexShrink: 0,
    alignSelf: "center",
    minHeight: 34,
    overflow: "hidden",
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 7,

  },
});
