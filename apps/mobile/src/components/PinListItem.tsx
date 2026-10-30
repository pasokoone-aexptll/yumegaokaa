import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export function PinListItem({
  title,
  subtitle,
  longitude,
  latitude,
  onOpen,
}: {
  title: string;
  subtitle: string;
  longitude: number;
  latitude: number;
  onOpen: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}の詳細`}
        onPress={onOpen}
        style={styles.details}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}の地図を開く`}
        onPress={() =>
          router.navigate({
            pathname: "/",
            params: { longitude, latitude },
          })
        }
        style={styles.map}
      >
        <Text style={styles.mapText}>地図を開く ›</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dfe8ec",
    gap: 4,
  },
  details: { gap: 8, paddingVertical: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#202b35" },
  subtitle: { color: "#697b88", fontSize: 15 },
  map: { alignSelf: "flex-start", paddingVertical: 10, paddingRight: 16 },
  mapText: { color: "#008cff", fontSize: 16 },
});
