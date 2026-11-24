import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { Notice, type BannerProps } from "./StatusNotice";
// Keep the outgoing notice mounted until its exit animation finishes.
export function MapStatusBanner(props: BannerProps) {
  const [displayed, setDisplayed] = useState(props);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  }, [props]);
  const [exit] = useState(() => new Animated.Value(1));
  if (!displayed.message && props.message) setDisplayed(props);
  useEffect(() => {
    if (props.message === displayed.message) {
      exit.setValue(1);
      return;
    }
    const motion = Animated.timing(exit, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    });
    motion.start(({ finished }) => {
      if (finished) setDisplayed(latest.current);
    });
    return () => motion.stop();
  }, [props.message, displayed, exit]);
  return displayed.message ? (
    <Animated.View
      style={{
        transform: [
          {
            translateY: exit.interpolate({
              inputRange: [0, 1],
              outputRange: [-12, 0],
            }),
          },
        ],
      }}
    >
      <Notice
        key={displayed.message}
        {...(props.message === displayed.message ? props : displayed)}
      />
    </Animated.View>
  ) : null;
}
