import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { Notice, type BannerProps } from "./StatusNotice";
// Keep the outgoing notice mounted until its exit animation finishes.
export function MapStatusBanner(props: BannerProps) {
  const [displayed, setDisplayed] = useState(props.message);
  const [exit] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (props.message === displayed) {
      exit.setValue(1);
      return;
    }
    if (!displayed) {
      setDisplayed(props.message);
      return;
    }
    const motion = Animated.timing(exit, { toValue: 0, duration: 220, useNativeDriver: true });
    motion.start(({ finished }) => { if (finished) setDisplayed(props.message); });
    return () => motion.stop();
  }, [props.message, displayed, exit]);
  return displayed ? <Animated.View style={{ opacity: exit }}>
    <Notice key={displayed} {...props} message={displayed} />
  </Animated.View> : null;
}
