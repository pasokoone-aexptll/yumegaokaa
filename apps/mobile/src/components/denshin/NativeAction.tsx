import { SuperAsset, type SuperAssetName } from "../icons/SuperAsset";
import { Pressable, Text } from "react-native";
export function NativeAction({
  title,
  onPress,
  disabled = false,
  destructive = false,
  tone = "green",
  contentWidth = 168,
  compact = false,
  onDark = false,
  leadingIcon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  tone?: "green" | "blue" | "neutral";
  contentWidth?: number;
  compact?: boolean;
  onDark?: boolean;
  leadingIcon?: SuperAssetName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        padding: compact ? 10 : 16,
        minWidth: contentWidth,
        borderRadius: 40,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
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
      {leadingIcon && (
        <SuperAsset
          name={leadingIcon}
          size={20}
          tint={tone === "neutral" && !onDark ? "black" : "white"}
        />
      )}
      <Text
        style={{
          color: tone === "neutral" && !onDark ? "black" : "white",
          fontFamily: "ui-rounded",
          fontSize: compact ? 16 : 18,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
