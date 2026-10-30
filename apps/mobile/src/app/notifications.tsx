import { Text, View } from "react-native";
import { router } from "expo-router";
import { Action, Empty, Page, ui } from "../components/Page";
import { useNotifications } from "../hooks/useNotifications";
export default function Notifications() {
  const { items, error, loading, reading, load, markRead } = useNotifications();
  return (
    <Page title="お知らせ">
      {!!error && <Text style={ui.error}>{error}</Text>}
      {loading && <Text>読み込み中…</Text>}
      {!loading && !error && !items.length && (
        <Empty>お知らせはありません。</Empty>
      )}
      {items.map((n) => (
        <View key={n.id} style={ui.card}>
          <Text style={{ fontWeight: n.read ? "400" : "700" }}>
            {!n.read ? "● " : ""}
            {n.title}
          </Text>
          <Text>
            {n.kind === "canceled"
              ? "参加予定のイベントが中止されました"
              : "参加予定のイベントに変更があります"}
          </Text>
          <Text>{new Date(n.created_at).toLocaleString()}</Text>
          <Action
            title={
              n.kind === "canceled"
                ? n.read
                  ? "確認済み"
                  : "確認しました"
                : "詳細を確認"
            }
            disabled={reading !== null || (n.kind === "canceled" && n.read)}
            onPress={() =>
              void (async () => {
                if ((await markRead(n)) && n.kind === "changed")
                  router.push({
                    pathname: "/events/[id]",
                    params: { id: n.event_id },
                  });
              })()
            }
          />
        </View>
      ))}
      <Action title="再読み込み" onPress={() => void load()} />
    </Page>
  );
}
