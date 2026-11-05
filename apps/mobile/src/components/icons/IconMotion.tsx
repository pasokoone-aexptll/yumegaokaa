import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Pressable,
  type PressableProps,
} from "react-native";

export const IconActivation = createContext(0);
export const ReducedIconMotion = createContext(true);
export function IconMotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return (
    <ReducedIconMotion.Provider value={reduced}>
      {children}
    </ReducedIconMotion.Provider>
  );
}
/** The whole control activates its descendant icons; actions still run on release. */
export function IconPressable({
  children,
  onPressIn,
  ...props
}: PressableProps) {
  const [activation, activate] = useState(0);
  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        activate((value) => value + 1);
        onPressIn?.(event);
      }}
    >
      {(state) => (
        <IconActivation.Provider value={activation}>
          {typeof children === "function" ? children(state) : children}
        </IconActivation.Provider>
      )}
    </Pressable>
  );
}
