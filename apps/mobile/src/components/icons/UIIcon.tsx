import { memo, useContext, useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { SvgAst, parse } from "react-native-svg";
import frames from "./frames.json";
import { SuperAsset, type SuperAssetName } from "./SuperAsset";
import { IconActivation, ReducedIconMotion } from "./IconMotion";
export type UIIconName = keyof typeof frames;
const parsed = new Map<string, ReturnType<typeof parse>>();
function frameAst(name: UIIconName, frame: number) {
  const key = `${name}:${frame}`;
  if (!parsed.has(key)) parsed.set(key, parse(frames[name][frame]));
  return parsed.get(key)!;
}
/** Reviewed SVG geometry sampled from the original layered motion, not a whole-icon scale. */
const LegacyIcon = memo(function LegacyIcon({
  name,
  size = 24,
  width = size,
  height = size,
  animateOnMount = false,
  delay = 0,
}: {
  name: UIIconName;
  size?: number;
  width?: number;
  height?: number;
  animateOnMount?: boolean;
  delay?: number;
}) {
  // Exported artwork includes shadow padding; compensate in the layout box.
  // Leave large illustrations (e.g. entry success) at their existing size.
  const displayWidth = Math.max(width, Math.min(width * 1.75, 48));
  const displayHeight = Math.max(height, Math.min(height * 1.75, 48));
  const activation = useContext(IconActivation);
  const reduced = useContext(ReducedIconMotion);
  const [progress] = useState(() => new Animated.Value(0));
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const listener = progress.addListener(({ value }) =>
      setFrame(Math.max(0, Math.min(12, Math.round(value * 12)))),
    );
    if ((activation || animateOnMount) && !reduced) {
      progress.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else progress.setValue(0);
    return () => {
      progress.stopAnimation();
      progress.removeListener(listener);
    };
  }, [activation, name, reduced, progress, animateOnMount, delay]);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={{ width: displayWidth, height: displayHeight }}
    >
      <SvgAst
        ast={frameAst(name, frame)}
        override={{
          width: displayWidth,
          height: displayHeight,
          accessible: false,
        }}
      />
    </View>
  );
});

const supplied: Partial<Record<UIIconName, SuperAssetName>> = {
  "chevron-left": "chevron-base",
  "chevron-right": "chevron-base",
  "map-pin": "map",
  users: "user-fill",
  user: "user",
  "user-plus": "inviteFriends",
  pencil: "edit",
  image: "myCityPoolIcon",
  "shield-check": "accountSettings",
  wrench: "運営",
  check: "check",
  "circle-check": "checkRounded",
  x: "x",
  "create-pin": "add",
  navi: "nav",
  "arrival-plug": "pluglogin",
};
export const UIIcon = memo(function UIIcon(
  props: Parameters<typeof LegacyIcon>[0],
) {
  const icon = supplied[props.name];
  if (!icon) return <LegacyIcon {...props} />;
  const { size = 24, width = size, height = size } = props;
  return (
    <View
      pointerEvents="none"
      style={
        props.name === "chevron-left"
          ? { transform: [{ rotate: "180deg" }] }
          : undefined
      }
    >
      <SuperAsset name={icon} width={width} height={height} />
    </View>
  );
});
