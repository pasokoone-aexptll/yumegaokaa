import NativeMaskedView from "@react-native-masked-view/masked-view";
import type { ComponentType, ReactElement } from "react";
import type { ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
// Package 0.3.2's NativeMethods constructor mixin is incompatible with RN 0.88's
// declarations. Its runtime is a React component accepting these public props.
const Mask = NativeMaskedView as unknown as ComponentType<
  ViewProps & {
    maskElement: ReactElement;
    androidRenderingMode?: "software" | "hardware";
  }
>;
export function ChatFade(props: ViewProps) {
  return (
    <Mask
      {...props}
      androidRenderingMode="software"
      maskElement={
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient
              id="chatOpacity"
              x1="0"
              y1="0"
              x2="0"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="white" stopOpacity={0} />
              <Stop offset="1" stopColor="white" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#chatOpacity)" />
        </Svg>
      }
    />
  );
}
