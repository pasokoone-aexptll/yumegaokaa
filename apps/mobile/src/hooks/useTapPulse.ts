import { useCallback, useEffect, useState } from "react";
import { Animated } from "react-native";

export function useTapPulse(nativeDriver = true) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => () => scale.stopAnimation(), [scale]);
  const pulse = useCallback(() => {
    scale.stopAnimation();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.14,
        duration: 100,
        useNativeDriver: nativeDriver,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 22,
        bounciness: 5,
        useNativeDriver: nativeDriver,
      }),
    ]).start();
  }, [scale, nativeDriver]);
  return { scale, pulse };
}
