import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import Svg, { Ellipse } from "react-native-svg";
export function PlacementRing({ revision }: { revision: number }) {
  const [scale] = useState(() => new Animated.Value(1.9));
  const [opacity] = useState(() => new Animated.Value(0.15));
  const [wobble] = useState(() => new Animated.Value(0));
  useEffect(() => {
    scale.setValue(1.9);
    opacity.setValue(0.15);
    wobble.setValue(0);
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence(
        [6, -5, 3, -1, 0].map((toValue) =>
          Animated.timing(wobble, {
            toValue,
            duration: 65,
            useNativeDriver: true,
          }),
        ),
      ),
    ]);
    const feedback = setTimeout(() => {
      void requireNativeModule("PresenceNative").entrySuccessHaptic?.();
    }, 240);
    animation.start();
    return () => {
      clearTimeout(feedback);
      animation.stop();
    };
  }, [revision, scale, opacity, wobble]);
  return (
    <Animated.View
      style={{
        width: 80,
        height: 65,
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: [
          { scale },
          {
            rotate: wobble.interpolate({
              inputRange: [-6, 6],
              outputRange: ["-6deg", "6deg"],
            }),
          },
        ],
      }}
    >
      <Svg width={64} height={46} viewBox="0 0 64 46">
        <Ellipse
          cx={32}
          cy={23}
          rx={22}
          ry={13}
          stroke="#ffffffaa"
          strokeWidth={3}
          fill="#ffffff33"
        />
        <Ellipse
          cx={32}
          cy={23}
          rx={30}
          ry={21}
          stroke="#ffffff99"
          strokeWidth={3}
          strokeDasharray="15 10"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}
