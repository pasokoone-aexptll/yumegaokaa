import { BlurView } from "expo-blur";
import NativeMaskedView from "@react-native-masked-view/masked-view";
import { RefreshMarker } from "./markerScale";
import { useContext, useState, useId } from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Svg, {
  Defs,
  Filter,
  FeGaussianBlur,
  FeOffset,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

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
  if (Platform.OS === "android")
    return (
      <Text numberOfLines={1} style={[s.text, { color: colors[0] }]}>
        {children}
      </Text>
    );
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
function LabelShadow({
  bubble = false,
  children,
}: {
  bubble?: boolean;
  children: ReactNode;
}) {
  const refresh = useContext(RefreshMarker);
  const shadow =
    Platform.OS === "ios"
      ? bubble
        ? require("../../../assets/map-markers/bubble-shadow-ios.png")
        : require("../../../assets/map-markers/countdown-shadow-ios.png")
      : bubble
        ? require("../../../assets/map-markers/bubble-shadow.png")
        : require("../../../assets/map-markers/countdown-shadow.png");
  return (
    <View collapsable={false} style={s.shadowFrame}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          accessible={false}
          resizeMode="stretch"
          fadeDuration={0}
          onLoadEnd={refresh}
          source={shadow}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      {children}
    </View>
  );
}

export function PinBubble({
  children,
  minWidth,
  textLength = 7,
  accessory,
}: {
  children: ReactNode;
  minWidth?: number;
  textLength?: number;
  accessory?: ReactNode;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const id = `bubbleShadow${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { width: w, height: h } = size;
  const r = h / 2;
  const center = w / 2;
  const tailScale =
    0.9 * (0.65 + (Math.min(7, Math.max(3, textLength)) - 3) * (0.35 / 4));
  // One silhouette: the tail shares its contour and shadow with the capsule.
  const outline = `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}A${r} ${r} 0 0 1 ${w - r} ${h}H${center + 18 * tailScale}Q${center + 14 * tailScale} ${h} ${center + 10 * tailScale} ${h + 3 * tailScale}L${center - 7 * tailScale} ${h + 17 * tailScale}Q${center - 12 * tailScale} ${h + 21 * tailScale} ${center - 12 * tailScale} ${h + 15 * tailScale}V${h + 5 * tailScale}Q${center - 12 * tailScale} ${h} ${center - 17 * tailScale} ${h}H${r}A${r} ${r} 0 0 1 0 ${r}A${r} ${r} 0 0 1 ${r} 0Z`;
  if (Platform.OS === "android") {
    return (
      <LabelShadow bubble>
        <View style={s.bubbleWrapper}>
          {w > 0 && h > 0 && (
            <Svg
              pointerEvents="none"
              width={w}
              height={h + 23}
              style={StyleSheet.absoluteFill}
            >
              <Path d={outline} fill="rgba(255,255,255,0.9)" />
            </Svg>
          )}
          <View
            onLayout={({ nativeEvent: { layout } }) =>
              setSize({ width: layout.width, height: layout.height })
            }
            style={[s.bubble, minWidth !== undefined && { minWidth }]}
          >
            {children}
          </View>
          <View style={{ height: 19 * tailScale }} />
          {accessory && (
            <View
              style={{ position: "absolute", right: -10, top: 24, zIndex: 4 }}
            >
              {accessory}
            </View>
          )}
        </View>
      </LabelShadow>
    );
  }
  return (
    <View collapsable={false} style={s.shadowFrame}>
      <View style={s.bubbleWrapper}>
        {w > 0 && h > 0 && (
          <Svg
            pointerEvents="none"
            width={w + 24}
            height={h + 44}
            viewBox={`-12 -12 ${w + 24} ${h + 44}`}
            style={{ position: "absolute", left: -12, top: -12 }}
          >
            <Defs>
              <Filter id={id} x="-30%" y="-60%" width="160%" height="240%">
                <FeGaussianBlur stdDeviation={4} />
                <FeOffset dy={2} />
              </Filter>
            </Defs>
            <Path d={outline} fill="rgba(0,0,0,0.16)" filter={`url(#${id})`} />
          </Svg>
        )}
        {w > 0 && h > 0 && (
          <Mask
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -1,
              left: -1,
              width: w + 2,
              height: h + 23,
            }}
            maskElement={
              <Svg
                width={w + 2}
                height={h + 23}
                viewBox={`-1 -1 ${w + 2} ${h + 23}`}
              >
                <Path d={outline} fill="white" />
              </Svg>
            }
          >
            <BlurView
              intensity={45}
              tint="default"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(255,255,255,0.9)" },
              ]}
            />
          </Mask>
        )}
        <View
          onLayout={({ nativeEvent: { layout } }) =>
            setSize({ width: layout.width, height: layout.height })
          }
          style={[s.bubble, minWidth !== undefined && { minWidth }]}
        >
          {children}
        </View>
        <View style={{ height: 19 * tailScale }} />
        {accessory && h > 0 && (
          <View
            style={{
              position: "absolute",
              right: -10,
              top: h * 0.6,
              zIndex: 4,
            }}
          >
            {accessory}
          </View>
        )}
      </View>
    </View>
  );
}

export function PinCountdown({ children }: { children: string }) {
  return (
    <LabelShadow>
      <View
        collapsable={false}
        style={[
          s.countdown,
          Platform.OS === "android" && {
            experimental_backgroundImage:
              "linear-gradient(180deg, #FE2E31, #FFABED)",
          },
        ]}
      >
        {Platform.OS !== "android" && <Gradient colors={pinRed} />}
        <Text
          numberOfLines={1}
          style={[s.text, { color: "white", includeFontPadding: false }]}
        >
          {children}
        </Text>
      </View>
    </LabelShadow>
  );
}
const s = StyleSheet.create({
  text: {
    fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
    fontSize: 14.4,
    textAlign: "center",
    includeFontPadding: false,
    fontWeight: "600",
  },
  shadowFrame: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignSelf: "center",
    maxWidth: "100%",
  },
  bubbleWrapper: { alignItems: "center", maxWidth: 240 },
  bubble: {
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
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
