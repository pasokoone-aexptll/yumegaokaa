import { ReducedIconMotion } from "../icons/IconMotion";
import {
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Animated, Easing, View } from "react-native";

/** Fill unused space gradually when there is no native scroll distance yet. */
export function ChatMessageReveal({
  waitForImage,
  animate,
  grow = false,
  children,
}: {
  waitForImage: boolean;
  animate: boolean;
  grow?: boolean;
  children: (ready: () => void) => ReactNode;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [ready, setReady] = useState(!waitForImage);
  const [entering, setEntering] = useState(animate && !reduced);
  const [growOnMount] = useState(entering && grow);
  const [height, setHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(entering ? 0 : 1));
  const growing = entering && growOnMount && !reduced;
  const imageReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    if (!entering || !ready || (growing && !height)) return;
    if (reduced) {
      progress.setValue(1);
      setEntering(false);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: !growOnMount,
      isInteraction: false,
    });
    animation.start(({ finished }) => {
      if (finished) setEntering(false);
    });
    return () => animation.stop();
  }, [entering, ready, growing, growOnMount, height, progress, reduced]);
  const content = children(imageReady);
  return (
    <Animated.View
      accessibilityElementsHidden={!ready}
      importantForAccessibility={ready ? "auto" : "no-hide-descendants"}
      style={[
        !ready && { height: 0, overflow: "hidden" },
        growing && {
          height: Animated.multiply(progress, height),
          overflow: "hidden",
        },
        {
          opacity: ready ? progress : 0,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {growOnMount ? (
        <View
          style={
            growing
              ? { position: "absolute", top: 0, left: 0, right: 0 }
              : undefined
          }
          onLayout={
            growing
              ? (event) => setHeight(event.nativeEvent.layout.height)
              : undefined
          }
        >
          {content}
        </View>
      ) : (
        content
      )}
    </Animated.View>
  );
}
