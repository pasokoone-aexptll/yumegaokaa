import { router, usePathname } from "expo-router";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export function Page({ title, children }: { title: string; children: ReactNode }) {
  const path = usePathname();
  return <SafeAreaView style={ui.page}><ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">{!["/", "/home", "/settings"].includes(path) && <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace("/")}><Text style={{ color: "#008cff", fontSize: 17 }}>‹ 戻る</Text></Pressable>}<Text style={ui.title}>{title}</Text>{children}</ScrollView></SafeAreaView>;
}
export function Action({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[ui.button, disabled && { opacity: .45 }]}><Text style={ui.buttonText}>{title}</Text></Pressable>;
}
export function Empty({ children }: { children: ReactNode }) { return <View style={ui.card}><Text style={ui.muted}>{children}</Text></View>; }
export const ui = StyleSheet.create({ page: { flex: 1, backgroundColor: "#f8fcff" }, content: { padding: 24, gap: 18 }, title: { fontSize: 30, fontWeight: "800", color: "#202b35" }, button: { backgroundColor: "#008cff", padding: 16, borderRadius: 24, alignItems: "center" }, buttonText: { color: "white", fontSize: 17, fontWeight: "700" }, card: { backgroundColor: "white", borderRadius: 22, padding: 20, gap: 10 }, muted: { color: "#697b88", lineHeight: 23 }, input: { backgroundColor: "#eef3f7", padding: 16, borderRadius: 14, fontSize: 16 }, error: { color: "#b32845" } });
