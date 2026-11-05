import { Animated, Pressable, type PressableProps } from "react-native";
import { useTapPulse } from "../hooks/useTapPulse";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedTabButton({
  onPress,
  style,
  ...props
}: PressableProps) {
  const { scale, pulse } = useTapPulse();
  return (
    <AnimatedPressable
      {...props}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        { transform: [{ scale }] },
      ]}
      onPress={(event) => {
        pulse();
        onPress?.(event);
      }}
    />
  );
}
