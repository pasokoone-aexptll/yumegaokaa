import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import type { useStreetMap } from "../hooks/useStreetMap";
import { localEntry } from "../lib/development";
import { streetMapStyles as styles } from "./streetMapStyles";

type Props = Pick<
  ReturnType<typeof useStreetMap>,
  "sheet" | "setSheet" | "exit" | "scan"
>;
export function StreetEntrySheet({ sheet, setSheet, exit, scan }: Props) {
  return (
    <Modal
      visible={sheet !== null}
      transparent
      animationType="slide"
      onRequestClose={() =>
        sheet === "success" ? setSheet(null) : void exit()
      }
    >
      <View style={styles.shade}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>
            {sheet === "success"
              ? "街への参加が完了しました"
              : sheet === "explain"
                ? "街に参加する"
                : sheet === "scanning"
                  ? "ステッカーにタッチ"
                  : "街への参加を記録中"}
          </Text>
          <Text style={styles.cloud}>{sheet === "success" ? "✓" : "☁︎"}</Text>
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
          ) : (
            <ActivityIndicator size="large" />
          )}
          {sheet !== "success" && (
            <Pressable accessibilityRole="button" onPress={() => void exit()}>
              <Text style={styles.link}>キャンセル</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
