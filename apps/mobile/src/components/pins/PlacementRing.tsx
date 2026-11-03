import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { BlurView } from "expo-blur";
import { requireNativeModule } from "expo-modules-core";
import Svg, { Circle } from "react-native-svg";
export function PlacementRing({
  revision,
  dragging = false,
  pitch = 45,
}: {
  revision: number;
  dragging?: boolean;
  pitch?: number;
}) {
  const flattening = Math.max(0.2, Math.cos((pitch * Math.PI) / 180));
  const [fall] = useState(() => new Animated.Value(0));
  useEffect(() => {
    fall.setValue(0);
    if (dragging) return;
    const animation = Animated.timing(fall, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [revision, dragging, fall]);
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
        style={{ position: "absolute", transform: [{ scaleY: flattening }] }}
      >
        <View
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            width: 44,
            height: 44,
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          <BlurView
            intensity={40}
            tint="default"
            style={{ width: 44, height: 44 }}
          />
        </View>
        <Svg width={64} height={64}>
          <Circle
            cx={32}
            cy={32}
            r={22}
            stroke="#ffffff99"
            strokeWidth={3}
            fill="#ffffff22"
          />
        </Svg>
      </View>
      <View
        pointerEvents="none"
        style={{ position: "absolute", transform: [{ scaleY: flattening }] }}
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
          <Svg width={80} height={80}>
            <Circle
              cx={40}
              cy={40}
              r={35}
              stroke="#ffffff55"
              strokeWidth={4.5}
              strokeDasharray="34 20.978"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>
      <Animated.Image
        pointerEvents="none"
        source={require("../../../assets/figma-map/pin.png")}
        resizeMode="contain"
        style={{
          position: "absolute",
          width: 84,
          height: 84,
          bottom: 32.5,
          opacity: fall.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.75],
          }),
          transform: [
            {
              translateY: fall.interpolate({
                inputRange: [0, 1],
                outputRange: [-64, 0],
              }),
            },
          ],
        }}
      />
    </Animated.View>
  );
}
