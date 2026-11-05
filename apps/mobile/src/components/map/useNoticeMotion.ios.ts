import { useEffect, useState } from "react";
import { Animated } from "react-native";

export function useNoticeMotion(autoDismiss: boolean) {
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
  function dismiss() {
    appearance.stopAnimation();
    progress.stopAnimation();
    Animated.timing(appearance, {
      toValue: 0,
      duration: 220,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }
  return { visible, appearance, progress, dismiss };
}
