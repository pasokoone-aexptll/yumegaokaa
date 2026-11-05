import { IconPressable as Pressable } from "../icons/IconMotion";
import { ParticipationSwitch } from "./ParticipationSwitch";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { MapAsset } from "./MapAsset";
import { SmoothSurface } from "./SmoothSurface";

export function MapHeader({
  name,
  offline = false,
  count,
  stale,
  active,
  onToggle,
  ghost = false,
  modeDisabled = false,
  onModePress,
}: {
  name: string;
  offline?: boolean;
  count?: number;
  stale: boolean;
  active: boolean;
  onToggle: (value: boolean) => void;
  ghost?: boolean;
  modeDisabled?: boolean;
  onModePress?: () => void;
}) {
  return (
    <View style={styles.row}>
      {!offline && name.startsWith("池袋") ? (
        <Image
          accessibilityLabel={name}
          source={require("../../../assets/brand/ikebukuro.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <View accessible accessibilityLabel={name}>
          <MapAsset
            name="DreamCloud Logo"
            width={offline ? 172 : 112}
            height={28}
            tint="white"
          />
        </View>
      )}
      {!offline && (
        <SmoothSurface
          color="#FF5151"
          gradient={["#FF9E9E", "#FF5151"]}
          borderGradient={["#FFD9D9", "#FFB8B8"]}
          radius={24}
          style={styles.count}
        >
          <MapAsset name="usericon" width={18} height={20} />
          <Text
            accessibilityLabel={
              count === undefined
                ? "チェックイン人数を取得中"
                : `${count}人がチェックイン中${stale ? "、最終取得時" : ""}`
            }
            style={styles.number}
          >
            {count ?? "—"}
            {stale && count !== undefined ? "*" : ""}
          </Text>
        </SmoothSurface>
      )}
      <View style={{ flex: 1 }} />
      <Pressable
        disabled={modeDisabled || !onModePress}
        onPress={onModePress}
        accessibilityRole="button"
        accessibilityLabel={`気配の公開設定：${ghost ? "ゴースト" : "通常"}`}
        accessibilityState={{ disabled: modeDisabled || !onModePress }}
      >
        <SmoothSurface
          color="#ffffff26"
          blurIntensity={25}
          radius={12}
          style={styles.mode}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: ghost ? "#9a9a9e" : active ? "#00bc83" : "#ffffff66" },
            ]}
          />
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <MapAsset name="chevron.right" size={16} />
          </View>
        </SmoothSurface>
      </Pressable>
      <ParticipationSwitch value={active} onChange={onToggle} />
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    marginBottom: 10,
  },
  logo: { width: 80, height: 51 },
  count: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 10,
    height: 39,
  },
  number: {
    color: "white",
    fontSize: 22,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
  },
  mode: {
    height: 38,
    width: 64,
    justifyContent: "center",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
