import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UIPreviewScenario } from "../components/debug/UIPreviewScenario";
import { screenCatalog, scenarios } from "../components/debug/catalog";

/** Isolated presentation fixtures: no native, repository, auth or DB mutations. */
export default function UIPreview() {
  const router = useRouter();
  const [selected, select] = useState("");
  const [query, setQuery] = useState("");
  const [id, setID] = useState("");
  if (!__DEV__)
    return (
      <SafeAreaView>
        <Text>開発ビルド専用です。</Text>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Pressable onPress={() => router.back()}>
          <Text>閉じる</Text>
        </Pressable>
        <Text style={{ fontSize: 28, fontWeight: "600" }}>UIプレビュー</Text>
        <Text>
          モックは実データを変更しません。実画面を開く操作は通常のアプリに戻ります。
        </Text>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>
          状態を再現（実UI部品）
        </Text>
        {scenarios.map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            onPress={() => select(key)}
            style={{ padding: 16, borderRadius: 16, backgroundColor: "white" }}
          >
            <Text>{label}</Text>
          </Pressable>
        ))}
        <Text style={{ fontSize: 20, fontWeight: "600" }}>
          全ページ索引 · {screenCatalog.length}画面
        </Text>
        <Text>
          以下は実画面への導線です。全ページのモック化は未対応。対象ID・権限・下書きが必要な画面は元の操作から開いてください。
        </Text>
        <TextInput
          placeholder="画面名・機能で検索"
          value={query}
          onChangeText={setQuery}
          style={{ backgroundColor: "white", padding: 14, borderRadius: 12 }}
        />
        <TextInput
          placeholder="イベント／募集／ステッカーID（実データ）"
          value={id}
          onChangeText={setID}
          autoCapitalize="none"
          style={{ backgroundColor: "white", padding: 14, borderRadius: 12 }}
        />
        {screenCatalog
          .filter((row) => row.join(" ").includes(query))
          .map(([path, title, description]) => {
            const contextual = [
              "/street-entry",
              "/pins/location",
              "/report",
            ].includes(path);
            const needsID =
              path.includes("[id]") ||
              path === "/map-event" ||
              path === "/map-recruitment";
            const disabled = contextual || (needsID && !id.trim());
            return (
              <View
                key={path}
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 16,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600" }}>{title}</Text>
                <Text>{description}</Text>
                <Text style={{ color: "#00000080" }}>{path}</Text>
                <Pressable
                  disabled={disabled}
                  onPress={() =>
                    router.push(
                      (needsID
                        ? {
                            pathname: path.replace(
                              "[id]",
                              encodeURIComponent(id.trim()),
                            ),
                            params: { id: id.trim() },
                          }
                        : path) as never,
                    )
                  }
                >
                  <Text style={{ color: disabled ? "#00000066" : "#007aff" }}>
                    {contextual
                      ? "Map・対象詳細の操作から開く"
                      : needsID && !id.trim()
                        ? "対象IDが必要"
                        : "実画面を開く（通常操作）"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
      </ScrollView>
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => select("")}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
          <View
            style={{
              padding: 14,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text>モック · 通信・保存なし</Text>
            <Pressable onPress={() => select("")}>
              <Text style={{ color: "#007aff" }}>閉じる</Text>
            </Pressable>
          </View>
          {!!selected && <UIPreviewScenario key={selected} name={selected} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
