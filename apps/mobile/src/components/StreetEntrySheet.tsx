import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
} from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import type { useStreetMap } from "../hooks/useStreetMap";
import { localEntry } from "../lib/development";
import { streetMapStyles as styles } from "./streetMapStyles";
import { MapAsset } from "./map/MapAsset";
import { EntryAnimation } from "./map/EntryAnimation";

type Props = Pick<
  ReturnType<typeof useStreetMap>,
  "sheet" | "setSheet" | "exit" | "scan"
>;
export function StreetEntrySheet({ sheet, setSheet, exit, scan }: Props) {
  const { width, height } = useWindowDimensions();
  const diameter = Math.min(300, width - 64, height * 0.35);
  const close = () => {
    if (sheet === "success" || sheet === "explain") setSheet(null);
    else void exit();
  };
  return (
    <>
      {sheet !== null && (
        <BlurView
          pointerEvents="none"
          intensity={45}
          tint="dark"
          style={{ position: "absolute", inset: 0 }}
        />
      )}
      <Modal
        visible={sheet !== null}
        transparent={false}
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        animationType="slide"
        allowSwipeDismissal
        onRequestClose={close}
        onShow={() => {
          if (Platform.OS === "ios") {
            const bridge = requireNativeModule("PresenceNative");
            void bridge.prepareEntrySheet?.();
          }
        }}
      >
        <SafeAreaView
          edges={["bottom"]}
          style={{
            flex: 1,
            backgroundColor: Platform.OS === "ios" ? "transparent" : "white",
          }}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={{
              padding: 20,
              paddingTop: 28,
              gap: 12,
              alignItems: "center",
            }}
          >
            <MapAsset name="DreamCloud Logo" width={147} height={22} />
            {sheet === "explain" && (
              <Pressable
                accessibilityRole="button"
                onPress={scan}
                style={{ padding: 8 }}
              >
                <Text style={{ color: "#0088ff" }}>
                  {localEntry ? "開発用タグで入街（NFC代用）" : "NFCを読み取る"}
                </Text>
              </Pressable>
            )}
            {sheet && <EntryAnimation phase={sheet} size={diameter} />}
            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: sheet === "checking" ? "#4387ff" : "#777",
                fontWeight: "600",
                fontSize: 16,
                textAlign: "center",
              }}
            >
              {sheet === "success"
                ? "街への参加が完了しました"
                : sheet === "explain"
                  ? "NFCステッカーで街にログイン"
                  : sheet === "scanning"
                    ? "ステッカーにタッチしてください"
                    : "街への参加を記録しています"}
            </Text>
            {sheet === "explain" && (
              <Text
                style={{ color: "#999", textAlign: "center", fontSize: 12 }}
              >
                参加中は画面を閉じても気配を共有します。名前や正確な現在地は地図に出ません。OFFで停止できます。
              </Text>
            )}
            {sheet === "checking" && (
              <Text
                style={{ color: "#999", textAlign: "center", fontSize: 12 }}
              >
                {localEntry
                  ? "開発用タグで接続中"
                  : "読み取りは完了しました。ステッカーから離して大丈夫です。"}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={{ padding: 12 }}
            >
              <Text style={styles.link}>
                {sheet === "success" ? "地図へ" : "キャンセル"}
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
