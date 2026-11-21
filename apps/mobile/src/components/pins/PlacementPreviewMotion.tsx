import { useContext, useEffect, useState, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { ReducedIconMotion } from "../icons/IconMotion";

/** Keep the native marker mounted; each location choice only restarts its fall. */
export function PlacementPreviewMotion({
  children,
  revision,
  active,
}: {
  children: ReactNode;
  revision: number;
  active: boolean;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [fall] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active || reduced) {
      fall.setValue(0);
      return;
    }
    fall.setValue(-64);
    const animation = Animated.timing(fall, {
      toValue: 0,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [revision, active, reduced, fall]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity: 0.55, transform: [{ translateY: fall }] }}
    >
      {children}
    </Animated.View>
  );
}
