import { Pressable, StyleSheet, Text, View } from "react-native";
import { openMapAt } from "../lib/mapNavigation";
import { DetailIcon } from "./DetailIcon";

export function PinListItem({
  title,
  subtitle,
  longitude,
  latitude,
  onOpen,
  detail,
}: {
  title: string;
  subtitle: string;
  longitude: number;
  latitude: number;
  onOpen: () => void;
  detail?: { kind: "event" | "recruitment"; id: string };
}) {
  return (
    <View style={s.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}の詳細`}
        onPress={onOpen}
        style={s.details}
      >
        <View style={s.thumbnail}>
          <DetailIcon
            name={
              detail?.kind === "recruitment"
                ? "people-outline"
                : "calendar-outline"
            }
            size={30}
            color="#00000077"
          />
        </View>
        <View style={s.copy}>
          <Text numberOfLines={3} style={s.title}>
            {title}
          </Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>
        <DetailIcon name="chevron-forward" size={16} color="#00000040" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}の地図を開く`}
        onPress={() => openMapAt(longitude, latitude, detail)}
        style={s.map}
      >
        <DetailIcon name="location-outline" size={16} color="#00000088" />
        <Text style={s.mapText}>地図で見る</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  row: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000014",
  },
  details: { flexDirection: "row", alignItems: "center", gap: 16 },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: "#00000005",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#00000010",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 7 },
  title: {
    fontSize: 19,
    fontWeight: "600",
    color: "#000000e6",
    lineHeight: 26,
  },
  subtitle: { fontSize: 15, color: "#00000088", lineHeight: 21 },
  map: {
    marginLeft: 88,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    alignSelf: "flex-start",
    minHeight: 44,
  },
  mapText: { fontSize: 14, color: "#00000088" },
});
