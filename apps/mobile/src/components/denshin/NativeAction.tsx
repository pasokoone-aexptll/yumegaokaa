import { SuperAsset, type SuperAssetName } from "../icons/SuperAsset";
import { Pressable, Text, type StyleProp, type TextStyle } from "react-native";
export function NativeAction({
  title,
  onPress,
  disabled = false,
  destructive = false,
  tone = "green",
  contentWidth = 156,
  compact = false,
  onDark = false,
  leadingIcon,
  trailingIcon,
  trailingRotation = 0,
  trailingSize = 18,
  trailingTint,
  contentAlign = "center",
  labelStyle,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  tone?: "green" | "blue" | "neutral" | "black";
  contentWidth?: number;
  compact?: boolean;
  onDark?: boolean;
  leadingIcon?: SuperAssetName;
  trailingIcon?: SuperAssetName;
  trailingRotation?: number;
  trailingSize?: number;
  trailingTint?: string;
  contentAlign?: "center" | "start";
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        minHeight: compact ? 40 : 54,
        minWidth: contentWidth + 32,
        maxWidth: "100%",
        alignSelf: "center",
        borderRadius: 40,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: contentAlign === "start" ? "flex-start" : "center",
        gap: 6,
        backgroundColor: destructive
          ? "#FF3B30"
          : tone === "black"
            ? "black"
            : tone === "blue"
              ? "#008CFF"
              : tone === "neutral"
                ? onDark
                  ? "rgba(255,255,255,0.18)"
                  : "#f2f2f7"
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
        style={[
          {
            color: tone === "neutral" && !onDark ? "black" : "white",
            flexShrink: 1,
            textAlign: "center",
            includeFontPadding: false,
            fontWeight: "600",
            fontSize: compact ? 16 : 18,
          },
          labelStyle,
        ]}
      >
        {title}
      </Text>
      {trailingIcon && (
        <SuperAsset
          name={trailingIcon}
          rotation={trailingRotation}
          size={trailingSize}
          tint={
            trailingTint ?? (tone === "neutral" && !onDark ? "black" : "white")
          }
        />
      )}
    </Pressable>
  );
}
