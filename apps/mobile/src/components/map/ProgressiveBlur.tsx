import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";
/** Public blur API only: narrow bands increase blur strength toward the edge.
 * No opaque tint panel or private iOS variable-blur filter is used. */
export function ProgressiveBlur({
  edge,
  intensity = 30,
}: {
  edge: "top" | "bottom";
  intensity?: number;
}) {
  const steps = 20;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: steps }, (_, i) => {
        const strength =
          edge === "bottom" ? i / (steps - 1) : 1 - i / (steps - 1);
        return (
          <BlurView
            key={i}
            tint="default"
            intensity={intensity * strength * strength}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${(i * 100) / steps}%`,
              height: `${100 / steps}%`,
            }}
          />
        );
      })}
    </View>
  );
}
