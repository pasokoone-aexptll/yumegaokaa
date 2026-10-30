import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { Action, Page, ui } from "../components/Page";
import { native } from "../lib/native";
export default function Profile() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    native
      .rpc<{ display_name: string }>("profile_get", {})
      .then((p) => setName(p.display_name ?? ""))
      .catch(() =>
        setStatus(
          "プロフィールを取得できません。ログインと接続を確認してください。",
        ),
      );
  }, []);
  async function save() {
    setBusy(true);
    try {
      await native.rpc("profile_save", { display_name: name });
      setStatus("保存しました");
    } catch {
      setStatus(
        "保存できませんでした。接続と名前を確認して再試行してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="プロフィール">
      <TextInput
        style={ui.input}
        placeholder="表示名"
        maxLength={50}
        value={name}
        onChangeText={setName}
      />
      <Action
        title="名前を保存"
        disabled={busy || !name.trim()}
        onPress={() => void save()}
      />
      <Text>{status}</Text>
      <Text style={ui.muted}>本人画像の設定は接続準備中です。</Text>
    </Page>
  );
}
