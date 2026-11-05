import { createRef, type ComponentRef } from "react";
import { Platform, type View } from "react-native";

// Only the street map is captured. Chat, controls and sheets stay outside it.
export const streetMapTarget = createRef<ComponentRef<typeof View>>();
export const mapBlur = Platform.OS === "android"
  ? { blurTarget: streetMapTarget, blurMethod: "dimezisBlurViewSdk31Plus" as const }
  : {};
