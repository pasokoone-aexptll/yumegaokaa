import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StreetLogin } from "../StreetLogin";
import { MapStatusBanner } from "../map/MapStatusBanner";
import { MapErrorDialog } from "../map/MapErrorDialog";
import { EntryAnimation } from "../map/EntryAnimation";

export function UIPreviewScenario({ name }: { name: string }) {
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
