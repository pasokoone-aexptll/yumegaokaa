import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
export function EntryPlaceMaterial(_: { coordinate: [number, number] }) {
  return (
    <BlurView
      pointerEvents="none"
      intensity={65}
      tint="systemUltraThinMaterialDark"
      style={StyleSheet.absoluteFill}
    />
  );
}
