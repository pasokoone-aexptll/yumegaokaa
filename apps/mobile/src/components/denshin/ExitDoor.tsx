import { useContext, useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { SvgXml } from "react-native-svg";
import assets from "../icons/superassets.json";
import { ReducedIconMotion } from "../icons/IconMotion";
const original = assets["非常口から人が出る"];
const paths = original.match(/<path\b[^>]*\/>/g) ?? [];
const door = paths
  .slice(1)
  .reduce((xml, path) => xml.replace(path, ""), original);
const person = original.replace(paths[0] ?? "", "");
/** Animate the user's original door/person paths without substituting artwork. */
export function ExitDoor({
  entering = false,
  size = 220,
}: {
  entering?: boolean;
  size?: number;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!entering || reduced) return;
    const motion = Animated.sequence([
      Animated.delay(450),
      Animated.timing(progress, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);
    motion.start();
    return () => motion.stop();
  }, [entering, reduced, progress]);
  const height = (size * 325) / 271;
  return (
    <View style={{ width: size, height }}>
      <SvgXml xml={door} width={size} height={height} />
      <Animated.View
        style={{
          position: "absolute",
          inset: 0,
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -size * 0.18],
              }),
            },
          ],
        }}
      >
        <SvgXml xml={person} width={size} height={height} />
      </Animated.View>
    </View>
  );
}
