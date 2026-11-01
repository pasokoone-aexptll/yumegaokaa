import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { SmoothSurface } from "./SmoothSurface";

export type MapNotice = {
  title: string;
  message: string;
  busy?: boolean;
  actions?: { title: string; onPress: () => void }[];
};
/** The caller keys this by the issue; dismissing UI never cancels an operation. */
export function MapFeedback({ notice }: { notice: MapNotice }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      {!open && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(true)}
          style={styles.reopen}
        >
          <Text style={styles.reopenText}>{notice.title} ›</Text>
        </Pressable>
      )}
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <BlurView intensity={35} tint="dark" style={styles.backdrop}>
          <SmoothSurface style={styles.card} radius={32}>
            <Text accessibilityRole="header" style={styles.title}>
              {notice.title}
            </Text>
            <Text style={styles.body}>{notice.message}</Text>
            {notice.busy && (
              <ActivityIndicator color="white" style={{ marginVertical: 12 }} />
            )}
            <View style={styles.actions}>
              {notice.actions?.map((action) => (
                <Pressable
                  key={action.title}
                  accessibilityRole="button"
                  onPress={() => {
                    setOpen(false);
                    action.onPress();
                  }}
                >
                  <Text style={styles.action}>{action.title}</Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
              >
                <SmoothSurface color="#cccccc" radius={24} style={styles.ok}>
                  <Text style={styles.okText}>OK</Text>
                </SmoothSurface>
              </Pressable>
            </View>
          </SmoothSurface>
        </BlurView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", paddingHorizontal: 42 },
  card: { padding: 24, minHeight: 190, gap: 14 },
  title: { color: "white", fontSize: 24, fontWeight: "700" },
  body: { color: "#b1b1b1", fontSize: 16, lineHeight: 24 },
  actions: { gap: 14, marginTop: 16 },
  action: { color: "#9dc0ff", fontSize: 16, paddingVertical: 4 },
  ok: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: "flex-start",
    minWidth: 120,
    alignItems: "center",
  },
  okText: { color: "#111", fontSize: 18, fontWeight: "600" },
  reopen: { alignSelf: "flex-end", paddingHorizontal: 14, paddingVertical: 8 },
  reopenText: { color: "#ffb1b9", fontSize: 13 },
});
