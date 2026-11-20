import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
const Appearance =
  Platform.OS === "ios"
    ? requireNativeViewManager<ViewProps>(
        "PresenceNative",
        "NativeSheetAppearance",
      )
    : null;
export function PinSheet({ children, onLayout }: {
  children: ReactNode;
  onLayout?: ViewProps["onLayout"];
}) {
  return (
    <KeyboardAvoidingView
      style={s.root}
      onLayout={onLayout}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {children}
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
    backgroundColor: Platform.OS === "ios" ? "transparent" : "#424b5a",
  },
});
