import { StyleSheet, View } from "react-native";

/** Figma's pink tint is composited over white, independently of the page. */
export function AccountHeaderBackground() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: "white" }]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(255,10,85,0.2)" },
        ]}
      />
    </View>
  );
}
