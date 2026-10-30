import { pendingCommand, submitCommand } from "../lib/commands";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useState } from "react";
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
  const access = useContext(AccountAccessContext);
  const receiving = access.status === "unregistered";
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<Invite[]>([]),
    [code, setCode] = useState(""),
    [issued, setIssued] = useState<{ id: string; code: string } | null>(null),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (receiving) return;
    try {
      setPending(!!(await pendingCommand("invite_create")));
      const result = await native.rpc<{ items: Invite[] }>("invite_list", {});
      setItems(result.items);
      setIssued((current) => {
        const item = result.items.find((invite) => invite.id === current?.id);
        return item && (item.used || item.revoked) ? null : current;
      });
    } catch {
      setStatus("招待一覧を取得できませんでした。");
    }
  }, [receiving]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  async function act(op: string, p: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const r =
        op === "invite_create"
          ? await submitCommand<{ id?: string; code?: string }>(
              "invite_create",
              {},
            )
          : await native.rpc<{ id?: string; code?: string }>(op, p);
      if (r.code && r.id) setIssued({ id: r.id, code: r.code });
      if (op === "invite_revoke" && issued?.id === p.id) setIssued(null);
      if (op === "invite_accept") access.retry();
      setStatus(
        op === "invite_accept" ? "招待を受け付けました。" : "更新しました。",
      );
      await refresh();
    } catch (e) {
      if (op === "invite_create") {
        setPending(!!(await pendingCommand("invite_create").catch(() => null)));
      }
      if (op === "invite_revoke") await refresh();
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
    <Page title={receiving ? "招待を受け取る" : "友人を招待"}>
      {!receiving && (
        <>
          <Text style={ui.muted}>
            招待は1回限り、7日間有効です。コードを公開の場所に載せないでください。
          </Text>
          <Action
            title={pending ? "前回の招待を確認" : "招待を発行"}
            disabled={busy}
            onPress={() => void act("invite_create")}
          />
          {!!issued && (
            <View style={ui.card}>
              <Text selectable>{issued.code}</Text>
              <Action
                title="コードを共有"
                onPress={() =>
                  void Share.share({
                    message: `夢ヶ丘の招待コード：${issued.code}（7日間・1回限り）`,
                  })
                }
              />
            </View>
          )}
        </>
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
      {receiving && (
        <Action
          title="ログアウト"
          disabled={busy}
          onPress={() =>
            void native
              .logout()
              .catch(() => setStatus("ログアウトできませんでした。"))
          }
        />
      )}
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
