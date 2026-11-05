import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
export const ChatTouchRegion = requireNativeViewManager<
  ViewProps & { surface?: boolean }
>("PresenceNative", "ChatTouchRegion");
