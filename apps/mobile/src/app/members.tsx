import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { MemberRow } from "../components/MemberRow";
import { useMembers } from "../hooks/useMembers";

export default function Members() {
  const { items, error, busy, more, refresh, loadMore } = useMembers();
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <Page title="参加者と招待枠">
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action
        title="最新の状態を取得"
        disabled={busy}
        onPress={() => void refresh()}
      />
      {busy && <ActivityIndicator />}
      {!items.length && !error && !busy && <Empty>参加者はありません。</Empty>}
      {items.map((member) => (
        <View key={member.account_id}>
          <Action
            title={`${member.display_name} · ${member.withdrawn_at ? "退会済み" : member.active ? "利用中" : "利用停止中"}${selected === member.account_id ? " ▴" : " ▾"}`}
            onPress={() =>
              setSelected(
                selected === member.account_id ? null : member.account_id,
              )
            }
          />
          {selected === member.account_id && (
            <MemberRow
              key={[
                member.account_id,
                member.weekly_limit,
                member.invite_paused,
                member.active,
                member.chat_restricted_until,
                member.withdrawn_at,
              ].join(":")}
              member={member}
              onSaved={refresh}
            />
          )}
        </View>
      ))}
      {more && (
        <Action
          title="続きを表示"
          disabled={busy}
          onPress={() => void loadMore()}
        />
      )}
    </Page>
  );
}
