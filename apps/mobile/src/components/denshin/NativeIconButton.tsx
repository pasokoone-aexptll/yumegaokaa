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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: active ? accent : dark ? "#45474a" : "#f2f2f7",
        opacity: disabled ? 0.35 : 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={{ transform: [{ rotate: `${rotation}deg` }] }}
      >
        <SuperAsset
          name={icon}
          size={
            icon === "chevron-base"
              ? 32
              : icon === "x"
                ? 16
                : size > 49
                  ? 26
                  : 22
          }
          tint={dark ? "white" : "black"}
        />
      </View>
    </Pressable>
  );
}
