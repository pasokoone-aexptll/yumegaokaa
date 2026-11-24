import Svg, { Path } from "react-native-svg";
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
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: active
          ? accent
          : dark
            ? "rgba(255,255,255,0.14)"
            : "rgba(255,255,255,0.55)",
        opacity: disabled ? 0.35 : 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={{ transform: [{ rotate: `${rotation}deg` }] }}
      >
        {icon === "x" || icon === "check" ? (
          <Svg width={28} height={28} viewBox="0 0 32 32" accessible={false}>
            <Path
              d={icon === "x" ? "M7 7L25 25M25 7L7 25" : "M5 16L12 23L27 7"}
              fill="none"
              stroke={dark ? "white" : "black"}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <SuperAsset
            name={icon}
            size={icon === "chevron-base" ? 32 : size > 49 ? 26 : 22}
            tint={dark ? "white" : "black"}
          />
        )}
      </View>
    </Pressable>
  );
}
