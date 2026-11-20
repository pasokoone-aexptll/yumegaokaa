import { Platform, Pressable, View } from "react-native";
import { Button, Host, RNHostView } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  disabled as disabledModifier,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { SuperAsset, type SuperAssetName } from "../icons/SuperAsset";

export function NativeIconButton({
  icon,
  label,
  onPress,
  disabled = false,
  active = false,
  dark = true,
  rotation = 0,
  accent = "#34C759",
  size = 49,
}: {
  icon: SuperAssetName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  dark?: boolean;
  rotation?: number;
  accent?: string;
  size?: number;
}) {
  const artwork = (
    <View
      style={{
        width: icon === "chevron-base" ? 36 : Math.max(28, size - 16),
        height: icon === "chevron-base" ? 36 : Math.max(28, size - 16),
        transform: [{ rotate: `${rotation}deg` }],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SuperAsset
        name={icon}
        size={
          icon === "chevron-base" ? 32 : icon === "x" ? 16 : size > 49 ? 26 : 22
        }
        tint={dark ? "white" : "black"}
      />
    </View>
  );
  if (Platform.OS === "ios")
    return (
      <Host
        style={{ width: size, height: size }}
        colorScheme={dark ? "dark" : "light"}
        alignment="center"
        ignoreSafeArea="all"
      >
        <Button
          onPress={onPress}
          modifiers={[
            buttonStyle(
              Number(Platform.Version) >= 26
                ? active
                  ? "glassProminent"
                  : "glass"
                : "bordered",
            ),
            buttonBorderShape("circle"),
            accessibilityLabel(label),
            disabledModifier(disabled),
            ...(active ? [tint(accent)] : []),
          ]}
        >
          <RNHostView matchContents>{artwork}</RNHostView>
        </Button>
      </Host>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: active ? accent : "rgba(255,255,255,0.15)",
        opacity: disabled ? 0.35 : 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {artwork}
    </Pressable>
  );
}
