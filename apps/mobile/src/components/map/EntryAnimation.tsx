import { useEffect } from "react";
import { Image, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
const Ring = Animated.createAnimatedComponent(Circle);
const Check = Animated.createAnimatedComponent(Path);
const circumference = 2 * Math.PI * 146;
function Dot({ index }: { index: number }) {
  const phase = useSharedValue(0);
  useEffect(() => {
    // Match legacy: independent column phases plus a sharper, short brightness pulse.
    const column = index % 3;
    const start = [0.08, 0.62, 0.31][column];
    phase.value = start;
    phase.value = withRepeat(
      withTiming(start + 1, {
        duration: [1390, 1810, 1570][column],
        easing: Easing.linear,
      }),
      -1,
    );
    return () => cancelAnimation(phase);
  }, [index, phase]);
  const style = useAnimatedStyle(() => {
    const progress = (phase.value - Math.floor(index / 3) * 0.18 + 1) % 1;
    return {
      opacity: interpolate(progress, [0, 0.16, 0.52, 1], [0.15, 1, 0.15, 0.15]),
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: "#00ADF2",
          left: (index % 3) * 18,
          top: Math.floor(index / 3) * 18,
        },
        style,
      ]}
    />
  );
}
/** Presentation only. Never advances the check-in state. */
export function EntryAnimation({
  phase,
  size,
}: {
  phase: "explain" | "scanning" | "checking" | "success";
  size: number;
}) {
  const reveal = useSharedValue(0),
    rotation = useSharedValue(0),
    completion = useSharedValue(0),
    check = useSharedValue(0);
  const active = phase === "scanning" || phase === "checking";
  useEffect(() => {
    reveal.value = withTiming(active ? 1 : 0, { duration: 350 });
    if (active) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.linear }),
        -1,
      );
    }
    if (phase === "success") {
      completion.value = 0;
      check.value = 0;
      completion.value = withTiming(1, {
        duration: 650,
        easing: Easing.linear,
      });
      check.value = withDelay(650, withTiming(1, { duration: 300 }));
    }
    return () => {
      cancelAnimation(reveal);
      cancelAnimation(rotation);
      cancelAnimation(completion);
      cancelAnimation(check);
    };
  }, [phase, active, reveal, rotation, completion, check]);
  const spin = useAnimatedProps(() => ({
    strokeDashoffset: -rotation.value * circumference,
  }));
  const complete = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - completion.value),
  }));
  const checked = useAnimatedProps(() => ({
    strokeDashoffset: 78 * (1 - check.value),
  }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -reveal.value * 30 }],
    opacity: 1,
  }));
  const textStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reveal.value * 36 }],
  }));
  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 320 320">
        <Circle cx={160} cy={160} r={156} fill="#ffffffaa" />
        <Circle
          cx={160}
          cy={160}
          r={146}
          fill="none"
          stroke="#0000000d"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {active && (
          <Ring
            cx={160}
            cy={160}
            r={146}
            rotation={-90}
            origin="160,160"
            fill="none"
            stroke="#00ADF2"
            strokeWidth={4}
            strokeDasharray={`${circumference * 0.73} ${circumference * 0.27}`}
            strokeLinecap="round"
            animatedProps={spin}
          />
        )}
        {phase === "success" && (
          <>
            <Ring
              cx={160}
              cy={160}
              r={146}
              rotation={-90}
              origin="160,160"
              fill="none"
              stroke="#00ADF2"
              strokeWidth={4}
              strokeDasharray={`${circumference} ${circumference}`}
              animatedProps={complete}
            />
            <Check
              d="M3.4165 23.917L20.4998 41.0003L58.0832 3.41699"
              transform="translate(129 138)"
              fill="none"
              stroke="#00ADF2"
              strokeWidth={6.83333}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="78 78"
              animatedProps={checked}
            />
          </>
        )}
      </Svg>
      {phase !== "success" && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View style={logoStyle}>
            <Image
              source={
                active
                  ? require("../../../assets/figma-map/DreamCloud.png")
                  : require("../../../assets/figma-map/entry-logo.png")
              }
              style={{ width: 116, height: 80 }}
              resizeMode="contain"
            />
          </Animated.View>
          {active && (
            <View
              style={{
                position: "absolute",
                top: "49%",
                width: 46,
                height: 46,
              }}
            >
              {Array.from({ length: 9 }, (_, index) => (
                <Dot key={index} index={index} />
              ))}
            </View>
          )}
          <Animated.View style={textStyle}>
            <Image
              source={require("../../../assets/figma-map/entry-text.png")}
              style={{ width: 113, height: 33 }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
}
