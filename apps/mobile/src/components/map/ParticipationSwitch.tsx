import { useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { SmoothSurface } from "./SmoothSurface";
/** Explicit track/thumb geometry avoids OS-dependent UISwitch intrinsic bounds. */
export function ParticipationSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const [position] = useState(() => new Animated.Value(value ? 34 : 2));
  useEffect(() => {
    const animation = Animated.timing(position, {
      toValue: value ? 34 : 2,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [value, position]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="街への参加"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
    >
      <SmoothSurface
        color="#ffffff26"
        blurIntensity={25}
        radius={26}
        style={{
          width: 82,
          height: 46,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 64,
            height: 32,
            borderRadius: 16,
            backgroundColor: value ? "#2ecb54" : "#ffffff30",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 2,
              left: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "white",
              transform: [{ translateX: position }],
            }}
          />
        </View>
      </SmoothSurface>
    </Pressable>
  );
}
