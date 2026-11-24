import type { ComponentProps } from "react";
import { View } from "react-native";
import type { GlassView as ExpoGlassView } from "expo-glass-effect";

// Android has no Liquid Glass implementation. Keep the surface and contrast
// without sampling the MapLibre SurfaceView (the existing GPU-safe policy).
export function GlassView({
  colorScheme,
  tintColor,
  glassEffectStyle: _glassEffectStyle,
  isInteractive: _isInteractive,
  style,
  ...props
}: ComponentProps<typeof ExpoGlassView>) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor:
            tintColor ?? (colorScheme === "dark" ? "#45474a" : "#f2f2f7"),
        },
        style,
      ]}
    />
  );
}
