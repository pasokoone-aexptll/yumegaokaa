import { Pressable, View } from "react-native";
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
  size = 44,
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: active ? accent : "rgba(255,255,255,0.15)",
        opacity: disabled ? 0.35 : 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={{ transform: [{ rotate: `${rotation}deg` }] }}
      >
        <SuperAsset name={icon} size={22} tint={dark ? "white" : "black"} />
      </View>
    </Pressable>
  );
}
