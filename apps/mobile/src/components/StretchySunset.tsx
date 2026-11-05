import type { ReactNode } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
/** Negative scroll is pull-down. Scale around the center and translate up by
 * half the pull so the bottom stays attached and the top fills the overscroll. */
export function StretchySunset({
  scroll,
  height,
  children,
  overlayColor,
  style,
}: {
  scroll: Animated.Value;
  height: number;
  children: ReactNode;
  overlayColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pull = scroll.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1, 0, 0],
    extrapolateLeft: "extend",
    extrapolateRight: "clamp",
  });
  return (
    <View style={[{ height }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              { translateY: Animated.multiply(pull, -0.5) },
              { scale: Animated.add(1, Animated.divide(pull, height)) },
            ],
          },
        ]}
      >
        <Animated.Image
          source={require("../../assets/backgrounds/yuuyake.png")}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
        />
      </Animated.View>
      {children}
    </View>
  );
}
