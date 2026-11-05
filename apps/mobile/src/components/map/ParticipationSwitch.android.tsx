import { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import { SmoothSurface } from "./SmoothSurface";

export function ParticipationSwitch({ value, onChange }: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    const motion = Animated.spring(progress, {
      toValue: value ? 1 : 0, speed: 24, bounciness: 2, useNativeDriver: true,
    });
    motion.start();
    return () => motion.stop();
  }, [progress, value]);

  return (
    <Pressable accessibilityRole="switch" accessibilityLabel="街への参加"
      accessibilityState={{ checked: value }} onPress={() => onChange(!value)}>
      <SmoothSurface radius={26} color="#ffffff26" blurIntensity={25}
        style={{ width: 65, height: 46, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 51, height: 31, padding: 2, borderRadius: 16,
          backgroundColor: value ? "#34C759" : "#b8b8bc" }}>
          <Animated.View style={{ width: 27, height: 27, borderRadius: 14,
            backgroundColor: "white", elevation: 3, transform: [{ translateX:
              progress.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }} />
        </View>
      </SmoothSurface>
    </Pressable>
  );
}
