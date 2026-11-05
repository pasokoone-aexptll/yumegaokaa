import { View, type Animated, type ViewProps } from "react-native";

// Masking a scrolling list forces a software bitmap redraw on each frame.
export function ChatFade({ fadeTop: _fadeTop, ...props }: ViewProps & {
  fadeTop?: number | Animated.AnimatedInterpolation<number>;
}) {
  return <View {...props} />;
}
