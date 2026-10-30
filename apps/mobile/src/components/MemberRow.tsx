import { Alert, Text, TextInput, View } from "react-native";
import { Action, ui } from "./Page";
import { EventDateField } from "./EventDateField";
import { useMemberActions } from "../hooks/useMemberActions";
import type { Member } from "../lib/member";
export function MemberRow({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: () => Promise<void>;
}) {
  const {
    limit,
    setLimit,
    until,
    setUntil,
    reason,
    setReason,
    error,
    busy,
    restrict,
    saveLimit,
    restore,
    toggleInvites,
    toggleActive,
  } = useMemberActions(member, onSaved);
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
        onPress={() => void restrict()}
      />
      <Action
        title="投稿制限を解除"
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
        onPress={() => void restore()}
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
        onPress={() => void saveLimit()}
      />
      <Action
        title={member.invite_paused ? "招待発行を再開" : "招待発行を停止"}
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
        onPress={() => void toggleInvites()}
      />
      <Action
        title={member.active ? "利用停止" : "利用停止を解除"}
        disabled={busy || !!member.withdrawn_at || !reason.trim()}
        onPress={() =>
          Alert.alert(
            member.active ? "利用を停止しますか？" : "利用停止を解除しますか？",
            member.active
              ? "滞在・気配・募集を終了し、主催イベントを中止、参加登録も取り消します。"
              : "終了した滞在・イベント・参加登録は復活しません。",
            [
              { text: "戻る", style: "cancel" },
              {
                text: "確定",
                style: "destructive",
                onPress: () => void toggleActive(),
              },
            ],
          )
        }
      />
      {!!error && <Text style={ui.error}>{error}</Text>}
    </View>
  );
}
