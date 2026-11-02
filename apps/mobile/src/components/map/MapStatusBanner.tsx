import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SmoothSurface } from "./SmoothSurface";

/** Dismissing this notice never changes the underlying visit or observation state. */
export function MapStatusBanner({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const [progress] = useState(() => new Animated.Value(0));
  const [appearance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(appearance, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 7000,
        useNativeDriver: false,
      }),
      Animated.timing(appearance, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) setVisible(false);
    });
    return () => animation.stop();
  }, [appearance, progress]);
  if (!visible) return null;
  return (
    <Animated.View
      style={{
        opacity: appearance,
        transform: [
          {
            translateY: appearance.interpolate({
              inputRange: [0, 1],
              outputRange: [-8, 0],
            }),
          },
        ],
        marginTop: 8,
      }}
    >
      <SmoothSurface
        color="#00000080"
        blurIntensity={25}
        radius={20}
        style={{
          overflow: "hidden",
          borderRadius: 20,
          borderCurve: "continuous",
        }}
      >
        <View
          style={{
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: "#ffffff99", fontWeight: "700", fontSize: 15 }}
            >
              {message}
            </Text>
            {children}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={{
              backgroundColor: "#ffffffb3",
              borderRadius: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "black", fontWeight: "700", fontSize: 17 }}>
              OK
            </Text>
          </Pressable>
        </View>
        <Animated.View
          style={{
            height: 2,
            backgroundColor: "white",
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </SmoothSurface>
    </Animated.View>
  );
}
