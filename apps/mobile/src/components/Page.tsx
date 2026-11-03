import { DetailIcon } from "./DetailIcon";
import { GridBackground } from "./GridBackground";
import { router, usePathname } from "expo-router";
import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export function Page({
  title,
  children,
  headerAction,
  grid = false,
}: {
  title: string;
  children: ReactNode;
  headerAction?: ReactNode;
  grid?: boolean;
}) {
  const path = usePathname();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[ui.page, grid && { backgroundColor: "white" }]}
    >
      {grid && <GridBackground />}
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        {!["/", "/home", "/inbox", "/settings"].includes(path) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="戻る"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          >
            <DetailIcon name="chevron-back" size={22} color="#111" />
          </Pressable>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Text style={ui.title}>{title}</Text>
          {headerAction}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Action({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void | Promise<unknown>;
  disabled?: boolean;
}) {
  const [running, setRunning] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || running}
      accessibilityState={{ disabled: disabled || running, busy: running }}
      onPress={async () => {
        setRunning(true);
        try {
          await onPress();
        } finally {
          setRunning(false);
        }
      }}
      style={[ui.button, disabled && { opacity: 0.45 }]}
    >
      {running ? (
        <ActivityIndicator color="#008cff" />
      ) : (
        <Text style={ui.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <View style={ui.card}>
      <Text style={ui.muted}>{children}</Text>
    </View>
  );
}
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f2f2f7" },
  content: { flexGrow: 1, padding: 20, paddingBottom: 48, gap: 20 },
  title: { fontSize: 30, fontWeight: "600", color: "#000000e6" },
  button: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 18,
    borderCurve: "continuous",
    alignItems: "center",
  },
  buttonText: { color: "#008cff", fontSize: 17, fontWeight: "600" },
  card: { backgroundColor: "white", borderRadius: 22, padding: 20, gap: 10 },
  muted: { color: "#00000080", lineHeight: 23 },
  input: {
    backgroundColor: "#00000006",
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
  },
  error: { color: "#b32845" },
});
