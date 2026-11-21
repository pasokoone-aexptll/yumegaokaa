import { useContext, useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, View } from "react-native";
import { PlacementRing } from "./PlacementRing";
import { ReducedIconMotion } from "../icons/IconMotion";

/** Keep the native marker mounted; each location choice only restarts its fall. */
export function PlacementPreviewMotion({
  children,
  revision,
  active,
  pitch = 55,
  onHeight,
  dragging = false,
}: {
  children: ReactNode;
  revision: number;
  active: boolean;
  pitch?: number;
  onHeight?: (height: number) => void;
  dragging?: boolean;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [fall] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active || reduced || dragging) {
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
  }, [revision, active, reduced, dragging, fall]);
  return (
    <View onLayout={(event) => onHeight?.(event.nativeEvent.layout.height)}>
      {active && (
        <View
          pointerEvents="none"
          style={{ position: "absolute", bottom: -16, alignSelf: "center" }}
        >
          <PlacementRing
            revision={revision}
            pitch={pitch}
            dragging={dragging}
            showPin={false}
          />
        </View>
      )}
      <Animated.View
        pointerEvents="none"
        style={{ opacity: 0.55, transform: [{ translateY: fall }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
