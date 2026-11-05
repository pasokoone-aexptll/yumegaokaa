import MaskedView from "@react-native-masked-view/masked-view";
import type { ComponentType, ReactElement } from "react";
import { Animated, StyleSheet, View, type ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const Mask = MaskedView as unknown as ComponentType<ViewProps & {
  maskElement: ReactElement;
  androidRenderingMode: "hardware";
}>;

// Move the viewport edge, keeping its hardware mask static as messages scroll.
export function ChatFade({ fadeTop = 0, children, style, ...props }: ViewProps & {
  fadeTop?: number | Animated.AnimatedInterpolation<number>;
}) {
  return (
    <View {...props} style={[style, { overflow: "hidden" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: fadeTop }] }]}>
        <Mask style={{ flex: 1 }} androidRenderingMode="hardware" maskElement={
          <View style={{ flex: 1 }}>
            <Svg height={40} width="100%">
              <Defs><LinearGradient id="fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0" stopColor="white" stopOpacity={0} />
                <Stop offset="1" stopColor="white" />
              </LinearGradient></Defs>
              <Rect width="100%" height="100%" fill="url(#fade)" />
            </Svg>
            <View style={{ flex: 1, backgroundColor: "white" }} />
          </View>
        }>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: Animated.multiply(fadeTop, -1) }] }]}>
            {children}
          </Animated.View>
        </Mask>
      </Animated.View>
    </View>
  );
}
