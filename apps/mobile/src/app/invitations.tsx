import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Share, Text, TextInput, View } from "react-native";
import { Action, Page, ui } from "../components/Page";
import { native } from "../lib/native";
type Invite = {
  id: string;
  expires_at: string;
  used: boolean;
  revoked: boolean;
};
export default function Invitations() {
  const [items, setItems] = useState<Invite[]>([]),
    [code, setCode] = useState(""),
    [issued, setIssued] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setItems(
        (await native.rpc<{ items: Invite[] }>("invite_list", {})).items,
      );
    } catch {
      setStatus("招待を受け取った方は、ログイン後にコードを入力してください。");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  async function act(op: string, p: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const r = await native.rpc<{ code?: string }>(op, p);
      if (r.code) setIssued(r.code);
      setStatus(
        op === "invite_accept"
          ? "招待を受け付けました。プロフィールを設定し、Mapを開いてください。"
          : "更新しました。",
      );
      await refresh();
    } catch (e) {
      setStatus(
        String(e).includes("rate_limited")
          ? "招待は7日間に5件までです。"
          : "処理できませんでした。コード・期限・接続を確認してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="友人を招待">
      <Text style={ui.muted}>
        招待は1回限り、7日間有効です。コードを公開の場所に載せないでください。
      </Text>
      <Action
        title="招待を発行"
        disabled={busy}
        onPress={() => void act("invite_create")}
      />
      {!!issued && (
        <View style={ui.card}>
          <Text selectable>{issued}</Text>
          <Action
            title="コードを共有"
            onPress={() =>
              void Share.share({
                message: `夢ヶ丘の招待コード：${issued}（7日間・1回限り）`,
              })
            }
          />
        </View>
      )}
      <TextInput
        style={ui.input}
        placeholder="受け取った招待コード"
        autoCapitalize="none"
        value={code}
        onChangeText={setCode}
      />
      <Action
        title="招待を受け取る"
        disabled={busy || !code.trim()}
        onPress={() => void act("invite_accept", { code })}
      />
      <Text>{status}</Text>
      {items.map((i) => (
        <View key={i.id} style={ui.card}>
          <Text>
            {i.used
              ? "使用済み"
              : i.revoked
                ? "停止済み"
                : `有効期限 ${new Date(i.expires_at).toLocaleDateString()}`}
          </Text>
          {!i.used && !i.revoked && (
            <Action
              title="この招待を停止"
              disabled={busy}
              onPress={() => void act("invite_revoke", { id: i.id })}
            />
          )}
        </View>
      ))}
    </Page>
  );
}
