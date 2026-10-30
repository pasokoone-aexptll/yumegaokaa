import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { MemberRow, type Member } from "../components/MemberRow";
import { native } from "../lib/native";
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
            m.active +
            ":" +
            m.chat_restricted_until +
            ":" +
            m.withdrawn_at
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
