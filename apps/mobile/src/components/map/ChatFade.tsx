import NativeMaskedView from "@react-native-masked-view/masked-view";
import type { ComponentType, ReactElement } from "react";
import { Animated, View, type ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
// Package 0.3.2's NativeMethods constructor mixin is incompatible with RN 0.88's
// declarations. Its runtime is a React component accepting these public props.
const Mask = NativeMaskedView as unknown as ComponentType<
  ViewProps & {
    maskElement: ReactElement;
    androidRenderingMode?: "software" | "hardware";
  }
>;
export function ChatFade({
  fadeTop = 0,
  ...props
}: ViewProps & {
  fadeTop?: number | Animated.AnimatedInterpolation<number>;
}) {
  return (
    <Mask
      {...props}
      androidRenderingMode="software"
      maskElement={
        <Animated.View
          style={{ flex: 1, transform: [{ translateY: fadeTop }] }}
        >
          <Svg width="100%" height={40}>
            <Defs>
              <LinearGradient id="chatOpacity" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="white" stopOpacity={0} />
                <Stop offset="1" stopColor="white" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#chatOpacity)" />
          </Svg>
          <View style={{ flex: 1, backgroundColor: "white" }} />
        </Animated.View>
      }
    />
  );
}
