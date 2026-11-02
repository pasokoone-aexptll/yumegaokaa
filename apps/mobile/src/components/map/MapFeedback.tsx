import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
export type MapNotice = {
  title: string;
  message: string;
  busy?: boolean;
  actions?: { title: string; onPress: () => void }[];
};
/** Passive status lives next to its controls; never steals focus or dismisses input. */
export function MapFeedback({ notice }: { notice: MapNotice }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={styles.row}>
        {notice.busy && <ActivityIndicator size="small" color="#ffffff80" />}
        <Text style={styles.text}>{notice.message}</Text>
      </View>
      {!!notice.actions?.length && (
        <View style={styles.actions}>
          {notice.actions.map((action) => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={action.onPress}
              style={styles.action}
            >
              <Text style={styles.label}>{action.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000a6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { color: "#ffffff99", fontSize: 12, flex: 1, lineHeight: 17 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { paddingVertical: 8, paddingHorizontal: 4 },
  label: { color: "#ffffffeb", fontSize: 13 },
});
