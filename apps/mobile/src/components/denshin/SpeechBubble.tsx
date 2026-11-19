import { useState, type ReactNode } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

/** Size the bubble around its content; the tail never participates in text alignment. */
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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width: w, height: h } = size;
  const r = Math.min(h / 2, w / 2);
  const top = tail === "top" ? 14 : 0;
  const outline =
    tail === "top"
      ? `M${r} 14H25L10 0Q7 -2 7 3V15Q0 18 0 ${14 + r}V${14 + h - r}Q0 ${14 + h} ${r} ${14 + h}H${w - r}Q${w} ${14 + h} ${w} ${14 + h - r}V${14 + r}Q${w} 14 ${w - r} 14Z`
      : `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H26.5C23 ${h} 20 ${h + 1.86} 17 ${h + 4}C10 ${h + 9} 8 ${h + 9} 7.5 ${h + 8.5}C7 ${h + 8} 7 ${h + 7.18} 7.5 ${h + 6.5}C11.9 ${h + 0.5} 8.5 ${h - 2.29} 5.69 ${h - 5}Q0 ${h - 10} 0 ${r}A${r} ${r} 0 0 1 ${r} 0Z`;
  return (
    <View
      style={[
        s.root,
        { paddingTop: top, paddingBottom: tail === "bottom" ? 10 : 0 },
        style,
      ]}
    >
      {w > 0 && (
        <Svg
          pointerEvents="none"
          width={w}
          height={h + top + 10}
          style={StyleSheet.absoluteFill}
        >
          <Path d={outline} fill={color} />
        </Svg>
      )}
      <View
        onLayout={({ nativeEvent: { layout } }) =>
          setSize({ width: layout.width, height: layout.height })
        }
        style={s.body}
      >
        {children}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { alignSelf: "flex-start" },
  body: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 15,
    paddingVertical: 9,
    minHeight: 36,
  },
});
