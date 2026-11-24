import { useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { ReducedIconMotion } from "../icons/IconMotion";

export function RollingNumber({
  value,
  compact = false,
  light = false,
  color,
  placeholder = false,
}: {
  value: number;
  compact?: boolean;
  light?: boolean;
  color?: string;
  placeholder?: boolean;
}) {
  const reduced = useContext(ReducedIconMotion);
  const previous = useRef({ value, placeholder });
  const [transition, setTransition] = useState({
    from: { value, placeholder },
    to: { value, placeholder },
  });
  const [progress] = useState(() => new Animated.Value(1));
  useEffect(() => {
    setTransition({ from: previous.current, to: { value, placeholder } });
    previous.current = { value, placeholder };
    progress.stopAnimation();
    progress.setValue(reduced ? 1 : 0);
    Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : 280,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Drop the outgoing leading column after a digit-count decrease (10 → 9).
      // Interrupted animations must not overwrite the next value.
      if (finished) setTransition({ from: { value, placeholder }, to: { value, placeholder } });
    });
    return () => progress.stopAnimation();
  }, [value, placeholder, reduced, progress]);
  const direction =
    compact || transition.to.value >= transition.from.value ? 1 : -1;
  const layer = (incoming: boolean) => ({
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: incoming ? [0, 1] : [1, 0],
    }),
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: incoming ? [30 * direction, 0] : [0, -30 * direction],
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: incoming ? [0.5, 1] : [1, 0.5],
        }),
      },
    ],
  });
  const textStyle = [
    s.text,
    light && { color: "black" },
    color ? { color } : undefined,
  ];
  const placeholderStyle = { color: "rgba(0,0,0,0.3)" };
  return (
    <View
      accessible
      accessibilityLabel={`${value}`}
      style={[
        s.root,
        compact && {
          width: "100%",
          height: 56,
          borderRadius: 0,
          backgroundColor: "transparent",
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Array.from(
          {
            length: Math.max(
              String(transition.from.value).length,
              String(transition.to.value).length,
            ),
          },
          (_, index) => {
            const length = Math.max(
              String(transition.from.value).length,
              String(transition.to.value).length,
            );
            const from = String(transition.from.value).padStart(length, " ")[
              index
            ];
            const to = String(transition.to.value).padStart(length, " ")[index];
            return (
              <View
                key={length - index}
                style={{ width: 26, height: 52, justifyContent: "center" }}
              >
                {reduced ||
                (from === to &&
                  transition.from.placeholder === transition.to.placeholder) ? (
                  <Text
                    accessible={false}
                    style={[
                      textStyle,
                      transition.to.placeholder && placeholderStyle,
                    ]}
                  >
                    {to}
                  </Text>
                ) : (
                  <>
                    <Animated.Text
                      accessible={false}
                      style={[
                        textStyle,
                        transition.from.placeholder && placeholderStyle,
                        s.layer,
                        layer(false),
                      ]}
                    >
                      {from}
                    </Animated.Text>
                    <Animated.Text
                      accessible={false}
                      style={[
                        textStyle,
                        transition.to.placeholder && placeholderStyle,
                        s.layer,
                        layer(true),
                      ]}
                    >
                      {to}
                    </Animated.Text>
                  </>
                )}
              </View>
            );
          },
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: {
    width: 100,
    height: 58,
    overflow: "hidden",
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { position: "absolute", width: "100%" },
  text: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "ui-rounded",
    fontWeight: "600",
    fontSize: 40,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});
