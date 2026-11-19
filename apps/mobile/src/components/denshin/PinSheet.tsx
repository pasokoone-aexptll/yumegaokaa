import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { SheetChrome } from "../SheetChrome";
export function PinSheet({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {Platform.OS === "ios" && (
        <BlurView tint="dark" intensity={70} style={StyleSheet.absoluteFill} />
      )}
      <SheetChrome />
      {children}
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Platform.OS === "ios" ? "#333c5066" : "#424b5a",
  },
});
