import { useState, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { getSvgPath } from "figma-squircle";

/** Figma corner smoothing 60%, not an approximation using borderRadius. */
export function SmoothSurface({
  children,
  style,
  color = "#222222",
  radius = 24,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  radius?: number;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      style={style}
      onLayout={({ nativeEvent: { layout } }) => {
        setSize((old) =>
          old.width === layout.width && old.height === layout.height
            ? old
            : { width: layout.width, height: layout.height },
        );
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Svg
          pointerEvents="none"
          accessible={false}
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
        >
          <Path
            fill={color}
            d={getSvgPath({
              ...size,
              cornerRadius: radius,
              cornerSmoothing: 0.6,
            })}
          />
        </Svg>
      )}
      {children}
    </View>
  );
}
