import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { BlurView } from "expo-blur";
import { requireNativeModule } from "expo-modules-core";
import Svg, { Circle, Ellipse } from "react-native-svg";
export function PlacementRing({
  revision,
  dragging = false,
}: {
  revision: number;
  dragging?: boolean;
}) {
  const [scale] = useState(() => new Animated.Value(1.9));
  const [opacity] = useState(() => new Animated.Value(0.15));
  const [rotation] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);
  useEffect(() => {
    if (!dragging) {
      scale.setValue(1.8);
      opacity.setValue(0.2);
    }
    const a = Animated.parallel([
      Animated.timing(scale, {
        toValue: dragging ? 1.5 : 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: dragging ? 0.55 : 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);
    a.start();
    const timer = dragging
      ? undefined
      : setTimeout(() => {
          void requireNativeModule("PresenceNative").entrySuccessHaptic?.();
        }, 220);
    return () => {
      a.stop();
      clearTimeout(timer);
    };
  }, [revision, dragging, scale, opacity]);
  return (
    <Animated.View
      style={{
        width: 80,
        height: 65,
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: [{ scale }],
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 44,
          height: 26,
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        <BlurView
          intensity={40}
          tint="default"
          style={{ width: 44, height: 26 }}
        />
      </View>
      <Svg width={64} height={46} viewBox="0 0 64 46">
        <Ellipse
          cx={32}
          cy={23}
          rx={22}
          ry={13}
          stroke="#ffffffaa"
          strokeWidth={3}
          fill="#ffffff22"
        />
      </Svg>
      <View
        pointerEvents="none"
        style={{ position: "absolute", transform: [{ scaleY: 0.7 }] }}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <Svg width={64} height={64}>
            <Circle
              cx={32}
              cy={32}
              r={29}
              stroke="#ffffffaa"
              strokeWidth={3}
              strokeDasharray="16 14"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
