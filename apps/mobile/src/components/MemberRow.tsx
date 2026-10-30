import { useRef, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { Action, ui } from "./Page";
import { EventDateField } from "./EventDateField";
import { native } from "../lib/native";
export type Member = {
  account_id: string;
  display_name: string;
  active: boolean;
  withdrawn_at: string | null;
  chat_restricted_until: string | null;
  weekly_limit: number;
  invite_paused: boolean;
};
export function MemberRow({
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
  const writing = useRef(false);
  async function act(op: string, p: Record<string, unknown>) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await native.rpc(op, { account_id: member.account_id, reason, ...p });
      await onSaved();
    } catch {
      await onSaved();
      setError(
        "操作結果を確認できません。最新の状態と入力内容を確認してください。",
      );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <View style={ui.card}>
      <Text>
        {member.display_name} ·{" "}
        {member.withdrawn_at
          ? "退会済み"
          : member.active
            ? "利用中"
            : "利用停止中"}
      </Text>
      <TextInput
        editable={!busy && !member.withdrawn_at}
        style={ui.input}
        placeholder="操作理由（必須）"
        value={reason}
        onChangeText={setReason}
        maxLength={500}
      />
      <Text>
        {member.chat_restricted_until
          ? `投稿制限中 · ${new Date(member.chat_restricted_until).toLocaleString("ja-JP")}まで`
          : "投稿制限なし"}
      </Text>
      <EventDateField
        label="制限終了"
        disabled={busy || !!member.withdrawn_at}
        value={until}
        onChange={setUntil}
      />
      <Action
        title="投稿を制限"
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
        onPress={() => {
          const date = new Date(until);
          if (
            !Number.isFinite(date.getTime()) ||
            date.getTime() <= Date.now()
          ) {
            setError("未来の終了日時を選択してください。");
            return;
          }
          void act("operator_chat_restrict", { until_at: date.toISOString() });
        }}
      />
      <Action
        title="投稿制限を解除"
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
        onPress={() => void act("operator_chat_restore", {})}
      />
      <Text>7日間の招待枠</Text>
      <TextInput
        editable={!busy && !member.withdrawn_at}
        style={ui.input}
        accessibilityLabel="7日間の招待枠"
        value={limit}
        onChangeText={setLimit}
        keyboardType="number-pad"
      />
      <Action
        title="招待枠を保存"
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
        onPress={() => {
          const value = Number(limit);
          if (
            !limit.trim() ||
            !Number.isInteger(value) ||
            value < 0 ||
            value > 1000
          ) {
            setError("招待枠は0〜1000の整数で入力してください。");
            return;
          }
          void act("operator_invite_policy", {
            weekly_limit: value,
            paused: member.invite_paused,
          });
        }}
      />
      <Action
        title={member.invite_paused ? "招待発行を再開" : "招待発行を停止"}
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
        onPress={() =>
          void act("operator_invite_policy", {
            weekly_limit: member.weekly_limit,
            paused: !member.invite_paused,
          })
        }
      />
      <Action
        title={member.active ? "利用停止" : "利用停止を解除"}
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
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
