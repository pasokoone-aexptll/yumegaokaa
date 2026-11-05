import { BlurView } from "expo-blur";
import { useId, useState, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Path } from "react-native-svg";
import { getSvgPath } from "figma-squircle";

/** Figma corner smoothing 60%, not an approximation using borderRadius. */
export function SmoothSurface({
  children,
  style,
  color = "#222222",
  radius = 24,
  blurIntensity = 0,
  backdrop,
  gradient,
  borderGradient,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  radius?: number;
  blurIntensity?: number;
  backdrop?: ReactNode;
  gradient?: [string, string];
  borderGradient?: [string, string];
}) {
  const id = useId().replace(/:/g, "");
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
      {blurIntensity > 0 && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderCurve: "continuous",
              overflow: "hidden",
            },
          ]}
        >
          <BlurView
            intensity={blurIntensity}
            tint="default"
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {backdrop && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderCurve: "continuous",
              overflow: "hidden",
            },
          ]}
        >
          {backdrop}
        </View>
      )}
      {size.width > 0 && size.height > 0 && (
        <Svg
          pointerEvents="none"
          accessible={false}
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
        >
          <Defs>
            {gradient && (
              <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={gradient[0]} />
                <Stop offset="1" stopColor={gradient[1]} />
              </LinearGradient>
            )}
            {borderGradient && (
              <LinearGradient id={`${id}-border`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={borderGradient[0]} />
                <Stop offset="1" stopColor={borderGradient[1]} />
              </LinearGradient>
            )}
          </Defs>
          <Path
            fill={gradient ? `url(#${id}-fill)` : color}
            d={getSvgPath({
              ...size,
              cornerRadius: radius,
              cornerSmoothing: 0.6,
            })}
          />
          {borderGradient && size.width > 3 && size.height > 3 && (
            <Path
              fill="none"
              stroke={`url(#${id}-border)`}
              strokeWidth={1.5}
              transform="translate(0.75 0.75)"
              d={getSvgPath({
                width: size.width - 1.5,
                height: size.height - 1.5,
                cornerRadius: radius - 0.75,
                cornerSmoothing: 0.6,
              })}
            />
          )}
        </Svg>
      )}
      {children}
    </View>
  );
}
