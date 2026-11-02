import { Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { MapAsset } from "./MapAsset";
import { SmoothSurface } from "./SmoothSurface";

export function MapHeader({
  name,
  count,
  stale,
  active,
  onToggle,
}: {
  name: string;
  count?: number;
  stale: boolean;
  active: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      {name.startsWith("池袋") ? (
        <Image
          accessibilityLabel={name}
          source={require("../../../assets/figma-map/ikebukuroLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.name}>{name}</Text>
      )}
      <SmoothSurface color="#ff4b57" radius={24} style={styles.count}>
        <Svg width={20} height={22} viewBox="0 0 20 22" accessible={false}>
          <Circle cx={10} cy={5} r={4} fill="white" />
          <Path d="M1 21v-4c0-9 18-9 18 0v4Z" fill="white" />
        </Svg>
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
      <View style={{ flex: 1 }} />
      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityLabel="気配の公開設定（準備中）"
        accessibilityState={{ disabled: true }}
      >
        <SmoothSurface color="#536172cc" radius={12} style={styles.mode}>
          <View
            style={[
              styles.dot,
              { backgroundColor: active ? "#00bc83" : "#98a1ac" },
            ]}
          />
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <MapAsset name="chevron.right" size={16} />
          </View>
        </SmoothSurface>
      </Pressable>
      <SmoothSurface color="#637183cc" radius={26} style={styles.toggle}>
        <Switch
          accessibilityLabel="街への参加"
          value={active}
          onValueChange={onToggle}
          trackColor={{ true: "#2ecb54", false: "#67717b" }}
          thumbColor="white"
        />
      </SmoothSurface>
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
  name: { color: "#7196ff", fontSize: 22, fontWeight: "800", maxWidth: 100 },
  count: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 10,
    height: 39,
  },
  number: { color: "white", fontSize: 22, fontWeight: "500" },
  mode: {
    height: 36,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  chevron: { color: "#cbd2db", fontSize: 24, lineHeight: 27 },
  toggle: { padding: 7 },
});
