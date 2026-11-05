import { IconPressable as Pressable } from "../icons/IconMotion";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { Animated, Platform, type PressableProps } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { useTapPulse } from "../../hooks/useTapPulse";

/** Animate the marker snapshot as well as the native view. */
export function MarkerFeedback({
  children,
  onPress,
  onPressIn,
  style,
  ...props
}: PressableProps) {
  const { scale, pulse } = useTapPulse(false);
  return (
    <Animated.View style={{ paddingBottom: 8, transform: [{ scale }] }}>
      <Svg pointerEvents="none" width={68} height={18} style={{ position: "absolute", alignSelf: "center", bottom: 0 }}>
        <Defs><RadialGradient id="groundShadow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#101522" stopOpacity={0.60} />
          <Stop offset="1" stopColor="#101522" stopOpacity={0} />
        </RadialGradient></Defs>
        <Ellipse cx={34} cy={9} rx={34} ry={9} fill="url(#groundShadow)" />
      </Svg>
      <Pressable
        {...props}
        style={style}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={(event) => {
          pulse();
          if (Platform.OS === "ios" || Platform.OS === "android") {
            try {
              void requireNativeModule("PresenceNative")
                .selectionHaptic?.()
                .catch(() => {});
            } catch {
              /* Preview without the native module. */
            }
          }
          onPressIn?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
