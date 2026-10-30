import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Text, TextInput, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { native } from "../lib/native";
type Member = {
  account_id: string;
  display_name: string;
  active: boolean;
  weekly_limit: number;
  invite_paused: boolean;
};
function MemberRow({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: () => Promise<void>;
}) {
  const [limit, setLimit] = useState(String(member.weekly_limit)),
    [until, setUntil] = useState(""),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(op: string, p: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await native.rpc(op, { account_id: member.account_id, reason, ...p });
      await onSaved();
    } catch {
      setError("操作できませんでした。理由・値・追加認証を確認してください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={ui.card}>
      <Text>
        {member.display_name} · {member.active ? "利用中" : "利用停止中"}
      </Text>
      <TextInput
        style={ui.input}
        placeholder="操作理由（必須）"
        value={reason}
        onChangeText={setReason}
        maxLength={500}
      />
      <Text>投稿制限</Text>
      <TextInput
        style={ui.input}
        placeholder="終了日時（例: 2026-11-01T18:00）"
        value={until}
        onChangeText={setUntil}
      />
      <Action
        title="投稿を制限"
        disabled={busy || !reason.trim()}
        onPress={() => {
          const date = new Date(until);
          if (!Number.isFinite(date.getTime())) {
            setError("終了日時を確認してください。");
            return;
          }
          void act("operator_chat_restrict", { until_at: date.toISOString() });
        }}
      />
      <Action
        title="投稿制限を解除"
        disabled={busy || !reason.trim()}
        onPress={() => void act("operator_chat_restore", {})}
      />
      <Text>7日間の招待枠</Text>
      <TextInput
        style={ui.input}
        value={limit}
        onChangeText={setLimit}
        keyboardType="number-pad"
      />
      <Action
        title="招待枠を保存"
        disabled={busy || !reason.trim()}
        onPress={() =>
          void act("operator_invite_policy", {
            weekly_limit: Number(limit),
            paused: member.invite_paused,
          })
        }
      />
      <Action
        title={member.invite_paused ? "招待発行を再開" : "招待発行を停止"}
        disabled={busy || !reason.trim()}
        onPress={() =>
          void act("operator_invite_policy", {
            weekly_limit: member.weekly_limit,
            paused: !member.invite_paused,
          })
        }
      />
      <Action
        title={member.active ? "利用停止" : "利用停止を解除"}
        disabled={busy || !reason.trim()}
        onPress={() =>
          Alert.alert(
            member.active ? "利用を停止しますか？" : "利用停止を解除しますか？",
            member.active
              ? "滞在・気配・募集を終了し、主催イベントも中止します。"
              : "終了した滞在・イベントは復活しません。",
            [
              { text: "戻る", style: "cancel" },
              {
                text: "確定",
                style: "destructive",
                onPress: () =>
                  void act("operator_member_state", { active: !member.active }),
              },
            ],
          )
        }
      />
      {!!error && <Text style={ui.error}>{error}</Text>}
    </View>
  );
}
export default function Members() {
  const [items, setItems] = useState<Member[]>([]),
    [error, setError] = useState(""),
    [more, setMore] = useState(false);
  const load = useCallback(async (after?: string) => {
    try {
      const r = await native.rpc<{ items: Member[] }>(
        "operator_members",
        after ? { after } : {},
      );
      setItems((p) =>
        after
          ? [
              ...p,
              ...r.items.filter(
                (x) => !p.some((y) => y.account_id === x.account_id),
              ),
            ]
          : r.items,
      );
      setMore(r.items.length === 100);
      setError("");
    } catch {
      setItems([]);
      setError("運営資格・追加認証または通信を確認してください。");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => setItems([]);
    }, [load]),
  );
  return (
    <Page title="参加者と招待枠">
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action title="最新の状態を取得" onPress={() => void load()} />
      {!items.length && !error && <Empty>参加者はありません。</Empty>}
      {items.map((m) => (
        <MemberRow
          key={
            m.account_id +
            ":" +
            m.weekly_limit +
            ":" +
            m.invite_paused +
            ":" +
            m.active
          }
          member={m}
          onSaved={() => load()}
        />
      ))}
      {more && (
        <Action
          title="続きを表示"
          onPress={() => void load(items.at(-1)?.account_id)}
        />
      )}
    </Page>
  );
}
