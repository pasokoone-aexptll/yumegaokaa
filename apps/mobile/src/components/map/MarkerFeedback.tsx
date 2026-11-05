import {
  Animated,
  Platform,
  Pressable,
  type PressableProps,
} from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { useTapPulse } from "../../hooks/useTapPulse";

/** Animate the marker snapshot as well as the native view. */
export function MarkerFeedback({
  children,
  onPress,
  style,
  ...props
}: PressableProps) {
  const { scale, pulse } = useTapPulse(false);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...props}
        style={style}
        accessibilityRole="button"
        onPress={(event) => {
          pulse();
          if (Platform.OS === "ios") {
            try {
              void requireNativeModule("PresenceNative")
                .selectionHaptic?.()
                .catch(() => {});
            } catch {
              /* Preview without the native module. */
            }
          }
          onPress?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
