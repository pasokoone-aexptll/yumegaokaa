import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SmoothSurface } from "./SmoothSurface";

/** Dismissing this notice never changes the underlying visit or observation state. */
export function MapStatusBanner({
  message,
  children,
  actionLabel = "OK",
  onAction,
  autoDismiss = true,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => Promise<void>;
  autoDismiss?: boolean;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(true);
  const [progress] = useState(() => new Animated.Value(0));
  const [appearance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const enter = Animated.timing(appearance, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    });
    if (!autoDismiss) {
      enter.start();
      return () => enter.stop();
    }
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
  }, [appearance, progress, autoDismiss]);
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
            paddingVertical: 10,
            paddingRight: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            accessible={false}
            source={require("../../../assets/figma-map/girl-viewing.png")}
            resizeMode="contain"
            style={{
              width: 54,
              height: 64,
              alignSelf: "flex-end",
              marginBottom: -10,
            }}
          />
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
            disabled={busy}
            accessibilityState={{ busy, disabled: busy }}
            onPress={async () => {
              if (!onAction) {
                setVisible(false);
                return;
              }
              setBusy(true);
              try {
                await onAction();
              } finally {
                setBusy(false);
              }
            }}
            style={{
              backgroundColor: "#ffffffb3",
              borderRadius: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            {busy ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text
                style={{
                  color: "black",
                  fontWeight: "700",
                  fontSize: 14,
                  fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
                }}
              >
                {actionLabel}
              </Text>
            )}
          </Pressable>
        </View>
        {autoDismiss && (
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
        )}
      </SmoothSurface>
    </Animated.View>
  );
}
