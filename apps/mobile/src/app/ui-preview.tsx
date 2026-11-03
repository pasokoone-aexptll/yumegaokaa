import { useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StreetLogin } from "../components/StreetLogin";
import { MapStatusBanner } from "../components/map/MapStatusBanner";
import { MapErrorDialog } from "../components/map/MapErrorDialog";
import { EntryAnimation } from "../components/map/EntryAnimation";
import { screenCatalog, scenarios } from "../components/debug/catalog";

/** Isolated presentation fixtures: no native, repository, auth or DB mutations. */
export default function UIPreview() {
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
          {!!selected && <Scenario key={selected} name={selected} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
function Scenario({ name }: { name: string }) {
  const [email, setEmail] = useState("preview@example.test"),
    [code, setCode] = useState("");
  const [sent, setSent] = useState(name === "otp"),
    [busy, setBusy] = useState(name === "loading-login");
  const [error, setError] = useState(
    name === "offline-login"
      ? "通信できませんでした。接続を確認して再試行してください。"
      : "",
  );
  const [result, setResult] = useState("");
  const [replay, setReplay] = useState(0);
  if (["login", "otp", "offline-login", "loading-login"].includes(name))
    return (
      <StreetLogin
        email={email}
        setEmail={setEmail}
        code={code}
        setCode={setCode}
        sent={sent}
        setSent={setSent}
        busy={busy}
        error={error}
        setError={setError}
        login={async () => {
          setBusy(true);
          await new Promise((r) => setTimeout(r, 900));
          setBusy(false);
          if (name === "offline-login")
            setError(
              "通信できませんでした。接続を確認して再試行してください。",
            );
          else if (!sent) setSent(true);
          else setError("プレビュー：認証完了（実際にはログインしません）");
        }}
      />
    );
  const entry = name === "explain" || name === "checking" || name === "success";
  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: entry ? "#ffffffcc" : "#202b38",
        gap: 20,
      }}
    >
      <Pressable
        onPress={() => {
          setReplay(replay + 1);
          setResult("");
        }}
      >
        <Text style={{ color: entry ? "#007aff" : "white" }}>もう一度表示</Text>
      </Pressable>
      {entry ? (
        <EntryAnimation key={replay} phase={name} size={300} />
      ) : name === "dialog" ? (
        <MapErrorDialog
          key={replay}
          message="通信できませんでした。接続を確認して再試行してください。"
        />
      ) : (
        <MapStatusBanner
          key={replay}
          autoDismiss={!name.startsWith("retry")}
          message={
            name === "restricted"
              ? "現在、投稿が制限されています。"
              : name.startsWith("retry")
                ? "チャットを取得できません。再読み込みしてください。"
                : "通知を確認してください"
          }
          actionLabel={name.startsWith("retry") ? "再読み込み" : "OK"}
          onAction={
            name.startsWith("retry")
              ? async () => {
                  setResult("loading");
                  await new Promise((r) => setTimeout(r, 1200));
                  if (name === "retry-fail") {
                    setResult("再試行失敗：通信は復旧していません。");
                    throw new Error("preview_offline");
                  }
                  setResult("再読み込み完了（モック）");
                }
              : undefined
          }
        />
      )}
      {result === "loading" ? (
        <ActivityIndicator color="white" />
      ) : (
        !!result && <Text style={{ color: "white" }}>{result}</Text>
      )}
    </View>
  );
}
