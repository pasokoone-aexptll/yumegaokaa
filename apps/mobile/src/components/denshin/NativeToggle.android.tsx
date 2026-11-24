import { useEffect, useState } from "react";
import { Animated, Pressable, type SwitchProps } from "react-native";

// Match the sheet controls' 64 × 36 footprint and translucent off state.
// Keep the same controlled value/callback contract as the native iOS toggle.
export function NativeToggle({
  value = false,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  trackColor,
}: SwitchProps) {
  const [position] = useState(() => new Animated.Value(value ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [position, value]);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      hitSlop={4}
      style={[
        {
          width: 64,
          height: 36,
          borderRadius: 18,
          padding: 4,
          flexShrink: 0,
          backgroundColor: value
            ? (trackColor?.true ?? "#34C759")
            : (trackColor?.false ?? "rgba(255,255,255,0.22)"),
          opacity: disabled ? 0.65 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          width: 32,
          height: 28,
          borderRadius: 16,
          backgroundColor: "white",
          transform: [
            {
              translateX: position.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 24],
              }),
            },
          ],
        }}
      />
    </Pressable>
  );
}
