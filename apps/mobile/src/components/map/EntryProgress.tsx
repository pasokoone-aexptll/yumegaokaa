import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SuperAsset } from "../icons/SuperAsset";
import { green } from "../denshin/PinParts";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const circumference = 2 * Math.PI * 20;
/** The ring acknowledges actual success; it never advances the entry state. */
export function EntryProgress({
  success,
  light = false,
  label,
  onboarding = false,
}: {
  success: boolean;
  light?: boolean;
  label?: string;
  onboarding?: boolean;
}) {
  const size = onboarding ? 66 : 44;
  const strokeWidth = onboarding ? 3.2 : 2;
  const [turn] = useState(() => new Animated.Value(0));
  const [completion] = useState(() => new Animated.Value(0));
  const [check] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => listener.remove();
  }, []);
  useEffect(() => {
    turn.setValue(0);
    completion.setValue(0);
    check.setValue(0);
    if (success) {
      const animation = Animated.sequence([
        Animated.timing(completion, {
          toValue: 1,
          duration: reduceMotion ? 0 : onboarding ? 150 : 650,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(check, {
          toValue: 1,
          duration: reduceMotion ? 0 : onboarding ? 150 : 220,
          useNativeDriver: true,
        }),
      ]);
      animation.start();
      return () => animation.stop();
    }
    if (reduceMotion) return;
    const animation = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: onboarding ? 1800 : 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [success, reduceMotion, turn, completion, check, onboarding]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? (success ? "ログイン成功" : "NFCを待機中")}
      style={{ width: size, height: size }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        style={StyleSheet.absoluteFill}
      >
        <Circle
          cx={22}
          cy={22}
          r={20}
          fill="none"
          stroke={light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)"}
          strokeWidth={strokeWidth}
        />
      </Svg>
      {success ? (
        <>
          <Svg
            width={size}
            height={size}
            viewBox="0 0 44 44"
            style={{ transform: [{ rotate: "-90deg" }] }}
          >
            <AnimatedCircle
              cx={22}
              cy={22}
              r={20}
              fill="none"
              stroke={onboarding ? "#01AE6B" : green}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={completion.interpolate({
                inputRange: [0, 1],
                outputRange: [circumference, 0],
              })}
            />
          </Svg>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                alignItems: "center",
                justifyContent: "center",
                opacity: check,
                transform: [
                  {
                    scale: check.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <SuperAsset
              name="check"
              size={onboarding ? 33 : 22}
              tint={onboarding ? "#01AE6B" : green}
            />
          </Animated.View>
        </>
      ) : (
        <Animated.View
          style={{
            transform: [
              {
                rotate: turn.interpolate(
                  onboarding
                    ? {
                        inputRange: [
                          0, 0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75,
                          0.85, 0.95, 1.05, 1.15, 1.25, 1.35, 1.45, 1.55, 1.65,
                          1.8,
                        ].map((t) => t / 1.8),
                        outputRange: [
                          0, -14.2, -51.6, -92.8, -139.2, -190.5, -246.9,
                          -308.2, -373.3, -440.4, -509.9, -581.8, -654.9,
                          -726.4, -794.9, -860.5, -923.1, -982, -1080,
                        ].map((degrees) => `${degrees}deg`),
                      }
                    : { inputRange: [0, 1], outputRange: ["0deg", "360deg"] },
                ),
              },
            ],
          }}
        >
          <Svg width={size} height={size} viewBox="0 0 44 44">
            <Circle
              cx={22}
              cy={22}
              r={20}
              fill="none"
              stroke={light ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`32 ${circumference - 32}`}
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
