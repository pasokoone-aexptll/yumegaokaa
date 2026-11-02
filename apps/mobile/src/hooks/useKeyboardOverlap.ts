import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Platform,
  View,
  type KeyboardEvent,
} from "react-native";

/** Cache the unmoving root frame before keyboard events; move the whole chat. */
export function useKeyboardOverlap(bottomInset = 0) {
  const root = useRef<ComponentRef<typeof View>>(null);
  const frame = useRef<{ y: number; height: number } | null>(null);
  const keyboardTop = useRef<number | null>(null);
  const [overlap, setOverlap] = useState(0);
  const [translation] = useState(() => new Animated.Value(0));
  const apply = useCallback(
    (duration = 0) => {
      const measured = frame.current;
      const bottom = measured
        ? measured.y + measured.height
        : Dimensions.get("window").height - bottomInset;
      const top = keyboardTop.current;
      const next =
        top === null
          ? 0
          : Math.max(0, Math.min(measured?.height ?? bottom, bottom - top));
      setOverlap(next);
      translation.stopAnimation();
      Animated.timing(translation, {
        toValue: -next,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [bottomInset, translation],
  );
  const measure = useCallback(() => {
    root.current?.measureInWindow((_x, y, _width, height) => {
      if (height <= 0) return;
      frame.current = { y, height };
      apply();
    });
  }, [apply]);
  useEffect(() => {
    const change = (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      apply(event.duration ?? 250);
    };
    const hide = (event: KeyboardEvent) => {
      keyboardTop.current = null;
      apply(event.duration ?? 250);
    };
    const subscriptions = [
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow",
        change,
      ),
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        hide,
      ),
      // Reconcile the final position even if an interactive transition skipped willChangeFrame.
      ...(Platform.OS === "ios"
        ? [
            Keyboard.addListener("keyboardDidShow", change),
            Keyboard.addListener("keyboardDidHide", hide),
          ]
        : []),
    ];
    const metrics = Keyboard.metrics();
    if (metrics) {
      keyboardTop.current = metrics.screenY;
      apply();
    }
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      translation.stopAnimation();
    };
  }, [apply, translation]);
  return { root, overlap, measure, translation };
}
