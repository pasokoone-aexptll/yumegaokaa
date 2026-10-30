import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { native } from "../lib/native";
type Invite = {
  id: string;
  issuer_name: string | null;
  recipient_name: string | null;
  used_at: string | null;
  revoked_at: string | null;
  expires_at: string;
};
export default function Screen() {
  const [operator, setOperator] = useState(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [factor, setFactor] = useState(""),
    [secret, setSecret] = useState(""),
    [code, setCode] = useState(""),
    [invites, setInvites] = useState<Invite[]>([]);
  const [summary, setSummary] = useState<{
    active_members: number;
    active_invitations: number;
  } | null>(null);
  const load = useCallback(async () => {
    const dashboard = await native.rpc<{
      active_members: number;
      active_invitations: number;
    }>("operator_dashboard", {});
    const list = await native.rpc<{ items: Invite[] }>("operator_invites", {});
    setSummary(dashboard);
    setInvites(list.items);
    setReady(true);
  }, []);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      setReady(false);
      setSecret("");
      setCode("");
      setError("");
      setInvites([]);
      setSummary(null);
      void (async () => {
        const status = await native.rpc<{ operator: boolean }>(
          "operator_status",
          {},
        );
        if (!live) return;
        setOperator(status.operator);
        if (!status.operator) return;
        const factors = await native.mfaFactors();
        if (!live) return;
        setFactor(
          factors.factors.find(
            (f) => f.factor_type === "totp" && f.status === "verified",
          )?.id ?? "",
        );
        try {
          await load();
        } catch {
          /* AAL1 requires the code form below. */
        }
      })().catch((e) => {
        if (live) setError(String(e));
      });
      return () => {
        live = false;
        setSecret("");
        setCode("");
      };
    }, [load]),
  );
  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="運営">
      {!!error && <Text style={ui.error}>{error}</Text>}
      {!operator ? (
        <Empty>
          運営資格が必要です。一般アカウントから資格を取得することはできません。
        </Empty>
      ) : !ready ? (
        <View style={ui.card}>
          <Text>運営操作には認証アプリのワンタイムコードが必要です。</Text>
          {!factor && (
            <Action
              title="認証アプリを登録"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  const f = await native.mfaEnroll();
                  setFactor(f.id);
                  setSecret(f.totp.secret);
                })
              }
            />
          )}
          {!!secret && (
            <>
              <Text>
                認証アプリへ設定キーを登録してください。画面を離れると非表示になります。
              </Text>
              <Text selectable>{secret}</Text>
            </>
          )}
          {!!factor && (
            <>
              <TextInput
                accessibilityLabel="認証アプリのコード"
                style={ui.input}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="6桁のコード"
              />
              <Action
                title="追加認証"
                disabled={busy || code.length !== 6}
                onPress={() =>
                  void run(async () => {
                    await native.mfaVerify(factor, code);
                    setSecret("");
                    setCode("");
                    await load();
                  })
                }
              />
            </>
          )}
        </View>
      ) : (
        <>
          <Empty>
            参加者 {summary?.active_members}人・有効な招待{" "}
            {summary?.active_invitations}件
          </Empty>
          <Action
            title="参加者・招待枠・利用停止"
            onPress={() => router.push("/members")}
          />
          <Action title="通報対応" onPress={() => router.push("/moderation")} />
          <Text style={ui.title}>招待の監督</Text>
          <Action
            title="最新の状態を取得"
            disabled={busy}
            onPress={() => void run(load)}
          />
          {!invites.length && <Empty>招待はありません。</Empty>}
          {invites.map((i) => (
            <View key={i.id} style={ui.card}>
              <Text>
                {i.issuer_name ?? "名前未設定"} →{" "}
                {i.recipient_name ?? (i.used_at ? "参加済み" : "未使用")}
              </Text>
              <Text>
                {i.revoked_at
                  ? "無効化済み"
                  : `期限 ${new Date(i.expires_at).toLocaleString()}`}
              </Text>
              {!i.revoked_at && (
                <Action
                  title="招待を無効化"
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      await native.rpc("operator_invite_revoke", { id: i.id });
                      await load();
                    })
                  }
                />
              )}
            </View>
          ))}
        </>
      )}
    </Page>
  );
}
