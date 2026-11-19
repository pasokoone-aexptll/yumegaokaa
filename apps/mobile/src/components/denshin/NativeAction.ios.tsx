import { Platform, Pressable, Text } from "react-native";
import { Host, Button } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  buttonBorderShape,
  controlSize,
  disabled as disabledModifier,
  tint,
} from "@expo/ui/swift-ui/modifiers";
export function NativeAction({
  title,
  onPress,
  disabled = false,
  destructive = false,
  tone = "green",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  tone?: "green" | "blue" | "neutral";
}) {
  if (Platform.OS === "ios")
    return (
      <Host
        style={{ height: 54, width: "100%" }}
        alignment="center"
        ignoreSafeArea="all"
      >
        <Button
          label={title}
          role={destructive ? "destructive" : "default"}
          onPress={onPress}
          modifiers={[
            buttonStyle(
              Number(Platform.Version) >= 26
                ? "glassProminent"
                : "borderedProminent",
            ),
            buttonBorderShape("capsule"),
            controlSize("large"),
            disabledModifier(disabled),
            tint(
              destructive
                ? "#FF3B30"
                : tone === "blue"
                  ? "#008CFF"
                  : tone === "neutral"
                    ? "rgba(255,255,255,0.75)"
                    : "#34C759",
            ),
          ]}
        />
      </Host>
    );
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        padding: 16,
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
      <Text style={{ color: "white", fontSize: 18 }}>{title}</Text>
    </Pressable>
  );
}
