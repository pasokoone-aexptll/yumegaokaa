import { SheetChrome } from "../SheetChrome";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const Appearance =
  Platform.OS === "ios"
    ? requireNativeViewManager<ViewProps>(
        "PresenceNative",
        "NativeSheetAppearance",
      )
    : null;
export function PinSheet({
  children,
  onLayout,
  expanded,
}: {
  expanded?: boolean;
  children: ReactNode;
  onLayout?: ViewProps["onLayout"];
}) {
  return (
    <KeyboardAvoidingView
      style={s.root}
      onLayout={onLayout}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {Platform.OS === "android" ? (
        <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
          <SheetChrome expanded={expanded} />
          <View style={{ flex: 1 }}>{children}</View>
        </SafeAreaView>
      ) : (
        children
      )}
      {Appearance && (
        <Appearance
          pointerEvents="none"
          style={{ position: "absolute", width: 1, height: 1 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === "android"
      ? {
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: "hidden" as const,
        }
      : {}),
    backgroundColor: Platform.OS === "ios" ? "transparent" : "#424b5a",
  },
});
