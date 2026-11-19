import { Pressable, Text } from "react-native";
export function NativeAction({
  title,
  onPress,
  disabled = false,
  destructive = false,
  tone = "green",
  contentWidth = 168,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  tone?: "green" | "blue" | "neutral";
  contentWidth?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        padding: 16,
        minWidth: contentWidth,
        borderRadius: 40,
        alignItems: "center",
        backgroundColor: destructive
          ? "#FF3B30"
          : tone === "blue"
            ? "#008CFF"
            : tone === "neutral"
              ? "rgba(255,255,255,0.75)"
              : "#34C759",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text
        style={{
          color: tone === "neutral" ? "black" : "white",
          fontFamily: "ui-rounded",
          fontSize: 18,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
