import { StyleSheet, View, useWindowDimensions } from "react-native";

export function GridBackground({
  color,
  spacing = 26,
}: {
  color?: string;
  spacing?: number;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {Array.from({ length: Math.ceil(width / spacing) }, (_, index) => (
        <View
          key={`column-${index}`}
          style={[
            styles.vertical,
            { left: index * spacing },
            color ? { backgroundColor: color } : undefined,
          ]}
        />
      ))}
      {Array.from({ length: Math.ceil(height / spacing) }, (_, index) => (
        <View
          key={`row-${index}`}
          style={[
            styles.horizontal,
            { top: index * spacing },
            color ? { backgroundColor: color } : undefined,
          ]}
        />
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  vertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#dfe8eb",
  },
  horizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#dfe8eb",
  },
});
