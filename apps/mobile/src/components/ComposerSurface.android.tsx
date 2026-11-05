import { View } from "react-native";
import type { ComponentProps } from "react";
import type { SmoothSurface } from "./map/SmoothSurface";

// One clipped surface spans both the input and send action. Keeping overlays
// out of the flex row also avoids Android TextInput's native bottom underline.
export function ComposerSurface({ children, style }: ComponentProps<typeof SmoothSurface>) {
  return <View style={[style, { alignSelf: "stretch", backgroundColor: "#45474a" }]}>{children}</View>;
}
