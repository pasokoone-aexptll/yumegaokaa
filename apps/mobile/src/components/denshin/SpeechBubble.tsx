import type { ReactNode } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

/** The original Figma tail curve, attached to a content-sized capsule. */
export function SpeechBubble({
  children,
  color = "white",
  style,
  tail = "bottom",
}: {
  children: ReactNode;
  color?: string;
  style?: ViewStyle;
  tail?: "top" | "bottom";
}) {
  return (
    <View
      style={[
        s.root,
        tail === "top" && { paddingBottom: 0, paddingTop: 14 },
        style,
      ]}
    >
      <View style={[s.body, { backgroundColor: color }]}>{children}</View>
      <Svg
        width={28}
        height={16}
        viewBox="0 30 28 16"
        style={[
          s.tail,
          tail === "top" && {
            bottom: undefined,
            top: 0,
            left: 15,
            transform: [{ scaleY: -1 }],
          },
        ]}
        pointerEvents="none"
      >
        <Path
          fill={color}
          d="M18.5 36.867C13.1143 36.867 8.82275 34.8862 5.69086 31.867C8.5 34.5751 11.9 37.367 7.5 43.367C7 44.0488 7 44.867 7.5 45.367C8 45.867 10 45.867 17 40.867C20 38.7241 23 36.867 26.5 36.867H18.5Z"
        />
      </Svg>
    </View>
  );
}
const s = StyleSheet.create({
  root: { alignSelf: "flex-start", paddingBottom: 8 },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 40,
  },
  tail: { position: "absolute", bottom: 0, left: 2 },
});
