import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { useStreetMap } from "../hooks/useStreetMap";
import { localEntry } from "../lib/development";
import { streetMapStyles as styles } from "./streetMapStyles";

type Props = Pick<
  ReturnType<typeof useStreetMap>,
  "sheet" | "setSheet" | "exit" | "scan"
>;
export function StreetEntrySheet({ sheet, setSheet, exit, scan }: Props) {
  const { width, height } = useWindowDimensions();
  const diameter = Math.min(280, width - 112, height * 0.3);
  const close = () => {
    if (sheet === "success" || sheet === "explain") setSheet(null);
    else void exit();
  };
  return (
    <Modal
      visible={sheet !== null}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={styles.shade}>
        <SafeAreaView
          edges={["bottom"]}
          style={{
            maxHeight: "90%",
            backgroundColor: "white",
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
          }}
        >
          <ScrollView contentContainerStyle={styles.sheet} bounces={false}>
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 3,
                backgroundColor: "#d9dfe3",
                alignSelf: "center",
              }}
            />
            <Text style={[styles.heading, { textAlign: "center" }]}>
              {sheet === "success"
                ? "街への参加が完了しました"
                : sheet === "explain"
                  ? "街に参加する"
                  : sheet === "scanning"
                    ? "ステッカーにタッチ"
                    : "街への参加を記録中"}
            </Text>
            <View
              style={{
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                borderWidth: 4,
                borderColor: sheet === "success" ? "#078bff" : "#e7edf2",
                borderStyle: sheet === "explain" ? "dashed" : "solid",
                alignSelf: "center",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f7f9fb",
              }}
            >
              {sheet === "checking" || sheet === "scanning" ? (
                <ActivityIndicator
                  size="large"
                  color="#078bff"
                  accessibilityLabel={
                    sheet === "checking" ? "参加を記録中" : "NFC読取待ち"
                  }
                />
              ) : (
                <Text style={styles.cloud}>
                  {sheet === "success" ? "✓" : "☁︎"}
                </Text>
              )}
            </View>
            {sheet !== "success" && (
              <Text style={styles.subtitle}>
                {sheet === "explain"
                  ? "参加中は画面を閉じても、このあたりにいる気配を共有します。名前や正確な現在地は地図に出ません。OFFで停止できます。"
                  : localEntry
                    ? "開発用タグから本物と同じDB/APIへ入街を記録しています。"
                    : "NFC読取にはiPhone標準の画面が開きます。読み取り後はステッカーから離して大丈夫です。"}
              </Text>
            )}
            {sheet === "success" ? (
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                onPress={() => setSheet(null)}
              >
                <Text style={styles.buttonText}>地図へ</Text>
              </Pressable>
            ) : sheet === "explain" ? (
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                onPress={scan}
              >
                <Text style={styles.buttonText}>
                  {localEntry ? "開発用タグで入街（NFC代用）" : "NFCを読み取る"}
                </Text>
              </Pressable>
            ) : null}
            {sheet !== "success" && (
              <Pressable accessibilityRole="button" onPress={close}>
                <Text style={styles.link}>キャンセル</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
