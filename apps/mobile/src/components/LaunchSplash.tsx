import { useContext, useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { ExitDoor } from "./denshin/ExitDoor";
import { SuperAsset } from "./icons/SuperAsset";
import { ReducedIconMotion } from "./icons/IconMotion";
export function LaunchSplash() {
  const reduced = useContext(ReducedIconMotion);
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const motion = Animated.sequence([
      Animated.delay(reduced ? 250 : 1050),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: reduced ? 1 : 5,
          duration: reduced ? 0 : 450,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: reduced ? 150 : 450,
          useNativeDriver: true,
        }),
      ]),
    ]);
    motion.start(({ finished: done }) => {
      if (done) setFinished(true);
    });
    return () => motion.stop();
  }, [opacity, scale, reduced]);
  if (finished) return null;
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.cover, { opacity }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <ExitDoor entering size={210} />
      </Animated.View>
      <View style={{ position: "absolute", bottom: 30 }}>
        <SuperAsset name="s3logo" width={70} height={24} opacity={0.2} />
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  cover: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
});
