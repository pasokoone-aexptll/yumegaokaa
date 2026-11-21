import { SuperAsset, type SuperAssetName } from "../icons/SuperAsset";
import {
  Platform,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { Host, Button, RNHostView } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  accessibilityLabel,
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
  if (Platform.OS === "ios")
    return (
      <Host
        style={{ height: compact ? 40 : 54, width: "100%" }}
        colorScheme={onDark ? "dark" : "light"}
        alignment="center"
        ignoreSafeArea="all"
      >
        <Button
          role={destructive ? "destructive" : "default"}
          onPress={onPress}
          modifiers={[
            buttonStyle(
              Number(Platform.Version) >= 26
                ? tone === "neutral"
                  ? "glass"
                  : "glassProminent"
                : "borderedProminent",
            ),
            accessibilityLabel(title),
            buttonBorderShape("capsule"),
            controlSize(compact ? "regular" : "large"),
            disabledModifier(disabled),
            tint(
              destructive
                ? "#FF3B30"
                : tone === "black"
                  ? "black"
                  : tone === "blue"
                    ? "#008CFF"
                    : tone === "neutral"
                      ? "rgba(255,255,255,0.75)"
                      : "#34C759",
            ),
          ]}
        >
          <RNHostView matchContents>
            <View
              style={{
                width: contentWidth,
                flexDirection: "row",
                alignItems: "center",
                justifyContent:
                  contentAlign === "start" ? "flex-start" : "center",
                gap: 6,
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
                    flexShrink: 1,
                    textAlign: "center",
                    fontFamily: "ui-rounded",
                    fontSize: compact ? 16 : 18,
                    fontWeight: "600",
                    color: tone === "neutral" && !onDark ? "black" : "white",
                    paddingVertical: 0,
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
                    trailingTint ??
                    (tone === "neutral" && !onDark ? "black" : "white")
                  }
                />
              )}
            </View>
          </RNHostView>
        </Button>
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
          : tone === "black"
            ? "black"
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
          color: tone === "neutral" && !onDark ? "black" : "white",
          fontSize: 18,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
