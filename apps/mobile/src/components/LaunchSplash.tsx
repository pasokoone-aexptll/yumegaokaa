import { useEffect, useState } from "react";
import { Animated, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapAsset } from "./map/MapAsset";

export function LaunchSplash() {
  const { width, height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(1));
  const [loaded, setLoaded] = useState(false);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (!loaded) return;
    const fade = Animated.sequence([
      Animated.delay(420),
      Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]);
    fade.start(({ finished: done }) => { if (done) setFinished(true); });
    return () => fade.stop();
  }, [loaded, opacity]);
  if (finished) return null;
  const size = Math.min(width * 0.74, height * 0.6);
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.cover, { opacity }]}>
    <Image source={require("../../assets/brand/splash-character.png")}
      resizeMode="contain" fadeDuration={0} onLoadEnd={() => setLoaded(true)}
      style={{ width: size, height: size * 998 / 1271 }} />
    <Animated.View style={{ position: "absolute", bottom: Math.max(bottom, 16) }}>
      <MapAsset name="DreamCloud Logo" width={width * 0.36} height={width * 0.36 * 22 / 147}
        tint="#000000" fillOpacity={0.24} />
    </Animated.View>
  </Animated.View>;
}
const styles = StyleSheet.create({
  cover: { position: "absolute", inset: 0, zIndex: 20, backgroundColor: "white", alignItems: "center", justifyContent: "center" },
});
