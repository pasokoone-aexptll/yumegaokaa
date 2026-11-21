import { ReducedIconMotion } from "../icons/IconMotion";
import {
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Animated, Easing } from "react-native";

/** Mount the avatar while collapsed, then reveal the complete row together. */
export function ChatMessageReveal({
  waitForImage,
  animate,
  children,
}: {
  waitForImage: boolean;
  animate: boolean;
  children: (ready: () => void) => ReactNode;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [ready, setReady] = useState(!waitForImage);
  const [opacity] = useState(
    () => new Animated.Value(animate && !reduced ? 0 : 1),
  );
  const imageReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    if (!ready || !animate || reduced) return;
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [ready, animate, opacity, reduced]);
  return (
    <Animated.View
      accessibilityElementsHidden={!ready}
      importantForAccessibility={ready ? "auto" : "no-hide-descendants"}
      style={[
        !ready && { height: 0, overflow: "hidden" },
        {
          opacity: ready ? opacity : 0,
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children(imageReady)}
    </Animated.View>
  );
}
