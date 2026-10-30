import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Action, Empty, Page, ui } from "../components/Page";
import { native } from "../lib/native";
type Notice = {
  id: string;
  event_id: string;
  title: string;
  kind: "changed" | "canceled";
  created_at: string;
  read: boolean;
};
export default function Notifications() {
  const [items, setItems] = useState<Notice[]>([]),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setItems(
        (await native.rpc<{ items: Notice[] }>("notification_list", {})).items,
      );
      setError("");
    } catch {
      setError("お知らせを取得できません。");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <Page title="お知らせ">
      {!!error && <Text style={ui.error}>{error}</Text>}
      {!error && !items.length && <Empty>お知らせはありません。</Empty>}
      {items.map((n) => (
        <View key={n.id} style={ui.card}>
          <Text>{n.title}</Text>
          <Text>
            {n.kind === "canceled"
              ? "参加予定のイベントが中止されました"
              : "参加予定のイベントに変更があります"}
          </Text>
          <Text>{new Date(n.created_at).toLocaleString()}</Text>
          <Action
            title={n.kind === "canceled" ? "確認しました" : "詳細を確認"}
            onPress={() =>
              void native
                .rpc("notification_read", { id: n.id })
                .then(() => {
                  if (n.kind === "changed")
                    router.push({
                      pathname: "/events/[id]",
                      params: { id: n.event_id },
                    });
                  else void load();
                })
                .catch(() => setError("確認を保存できませんでした。"))
            }
          />
        </View>
      ))}
      <Action title="再読み込み" onPress={() => void load()} />
    </Page>
  );
}
