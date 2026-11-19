import { useState, type ReactNode } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BlurView } from "expo-blur";

/** Size the bubble around its content; the tail never participates in text alignment. */
export function SpeechBubble({
  children,
  color = "white",
  style,
  tail = "bottom",
  bodyStyle,
  material = false,
}: {
  children: ReactNode;
  color?: string;
  style?: ViewStyle;
  tail?: "top" | "bottom";
  bodyStyle?: ViewStyle;
  material?: boolean;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width: w, height: h } = size;
  const r = Math.min(h / 2, w / 2);
  const top = tail === "top" ? 18 : 0;
  const outline =
    tail === "top"
      ? `M${r} ${top}H25V4Q25 -2 30 2L47 ${top}H${w - r}A${r} ${r} 0 0 1 ${w} ${top + r}V${top + h - r}A${r} ${r} 0 0 1 ${w - r} ${top + h}H${r}A${r} ${r} 0 0 1 0 ${top + h - r}V${top + r}A${r} ${r} 0 0 1 ${r} ${top}Z`
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
        style={[s.body, bodyStyle]}
      >
        {material && (
          <BlurView
            pointerEvents="none"
            intensity={70}
            tint="systemUltraThinMaterialDark"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: r, overflow: "hidden" },
            ]}
          />
        )}
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
    paddingVertical: 8,
    minHeight: 36,
  },
});
