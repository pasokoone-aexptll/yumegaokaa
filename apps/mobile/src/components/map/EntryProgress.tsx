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
export function EntryProgress({ success }: { success: boolean }) {
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
          duration: reduceMotion ? 0 : 650,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(check, {
          toValue: 1,
          duration: reduceMotion ? 0 : 220,
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
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [success, reduceMotion, turn, completion, check]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={success ? "ログイン成功" : "NFCを待機中"}
      style={{ width: 44, height: 44 }}
    >
      <Svg width={44} height={44} style={StyleSheet.absoluteFill}>
        <Circle
          cx={22}
          cy={22}
          r={20}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={2}
        />
      </Svg>
      {success ? (
        <>
          <Svg
            width={44}
            height={44}
            style={{ transform: [{ rotate: "-90deg" }] }}
          >
            <AnimatedCircle
              cx={22}
              cy={22}
              r={20}
              fill="none"
              stroke={green}
              strokeWidth={2}
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
            <SuperAsset name="check" size={22} tint={green} />
          </Animated.View>
        </>
      ) : (
        <Animated.View
          style={{
            transform: [
              {
                rotate: turn.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <Svg width={44} height={44}>
            <Circle
              cx={22}
              cy={22}
              r={20}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`32 ${circumference - 32}`}
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
