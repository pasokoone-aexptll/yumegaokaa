import { useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { useModeration } from "../hooks/useModeration";

export default function Moderation() {
  const router = useRouter();
  const { items, error, busy, loading, load, act } = useModeration();
  return (
    <Page title="通報対応">
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action
        title="最新の通報を取得"
        disabled={busy || loading}
        onPress={() => void load()}
      />
      {loading && <Text style={ui.muted}>読み込み中…</Text>}
      {!loading && !items.length && !error && (
        <Empty>未対応の通報はありません。</Empty>
      )}
      {items.map((r) => (
        <View key={r.id} style={ui.card}>
          <Text>
            {(
              {
                message: "投稿",
                recruitment: "募集",
                event: "オフ会",
              } as Record<string, string>
            )[r.target_kind] ?? r.target_kind}{" "}
            /{" "}
            {(
              {
                spam: "スパム",
                harassment: "迷惑行為",
                other: "その他",
              } as Record<string, string>
            )[r.reason] ?? r.reason}
            {r.review_due ? " · 整理対象" : ""}
          </Text>
          <Text>{r.description}</Text>
          <Text>{r.evidence.title}</Text>
          <Text>{r.evidence.body ?? r.evidence.description}</Text>
          {(r.target_kind === "event" || r.target_kind === "recruitment") && (
            <Action
              title={
                r.target_kind === "event"
                  ? "オフ会の詳細を確認"
                  : "募集の詳細を確認"
              }
              onPress={() =>
                router.push({
                  pathname:
                    r.target_kind === "event"
                      ? "/events/[id]"
                      : "/recruitments/[id]",
                  params: { id: r.target_id },
                })
              }
            />
          )}
          {r.target_kind === "message" && (
            <Action
              title="元の投稿を削除"
              disabled={busy || loading}
              onPress={() =>
                Alert.alert(
                  "投稿を削除しますか？",
                  "通常の本文は削除されます。通報証拠は保持期限まで残ります。",
                  [
                    { text: "戻る", style: "cancel" },
                    {
                      text: "削除",
                      style: "destructive",
                      onPress: () => void act("operator_message_delete", r.id),
                    },
                  ],
                )
              }
            />
          )}
          <Action
            title="対応完了"
            disabled={busy || loading}
            onPress={() => void act("operator_report_resolve", r.id, "handled")}
          />
          <Action
            title="対応不要として完了"
            disabled={busy || loading}
            onPress={() =>
              void act("operator_report_resolve", r.id, "no_action")
            }
          />
        </View>
      ))}
    </Page>
  );
}
