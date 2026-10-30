import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Action, Empty, Page, ui } from "../../components/Page";
import { useEventDetail } from "../../hooks/useEventDetail";
export default function Event() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    event,
    error,
    loading,
    busy,
    canceled,
    roster,
    rosterLoading,
    operator,
    load,
    act,
    loadRoster,
  } = useEventDetail(id);
  return (
    <Page title={event?.title ?? "オフ会"}>
      {!!error && <Text style={ui.error}>{error}</Text>}
      {!canceled && (
        <Action
          title="再取得"
          disabled={busy || loading}
          onPress={() => void load()}
        />
      )}
      {!event ? (
        <Empty>
          {canceled
            ? "イベントを中止しました"
            : loading
              ? "読み込み中…"
              : "イベントを表示できません"}
        </Empty>
      ) : (
        <>
          <Text>
            {new Date(event.starts_at).toLocaleString()}〜
            {new Date(event.ends_at).toLocaleString()}
          </Text>
          <Text>{event.description}</Text>
          <Text>
            {event.count} / {event.capacity} 人
          </Text>
          <Action
            title="通報"
            onPress={() =>
              router.push({
                pathname: "/report",
                params: { kind: "event", id },
              })
            }
          />
          <Action
            title="Mapで場所を見る"
            onPress={() =>
              router.navigate({
                pathname: "/",
                params: {
                  longitude: event.longitude,
                  latitude: event.latitude,
                },
              })
            }
          />
          <Action
            title={event.joined ? "参加を取り消す" : "参加する"}
            disabled={
              busy ||
              loading ||
              (!event.joined && event.count >= event.capacity)
            }
            onPress={() =>
              void act("event_register", {
                joined: !event.joined,
                revision: event.registration_revision,
              })
            }
          />
          {(event.mine || operator) && (
            <View style={ui.card}>
              <Action
                title="参加者一覧"
                disabled={busy || rosterLoading}
                onPress={() => void loadRoster()}
              />
              {rosterLoading && <Text>読み込み中…</Text>}
              {roster?.length === 0 && <Text>参加者はまだいません</Text>}
              {roster?.map((p) => (
                <Text key={p.account_id}>{p.display_name}</Text>
              ))}
              {operator && !!error && (
                <Action
                  title="運営の追加認証"
                  onPress={() => router.push("/admin")}
                />
              )}
            </View>
          )}
          {event.mine && (
            <View style={ui.card}>
              <Text>主催者の操作</Text>
              <Action
                title="イベントを編集"
                disabled={busy || loading}
                onPress={() =>
                  router.push({ pathname: "/events/edit/[id]", params: { id } })
                }
              />
              <Action
                title="イベントを中止"
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "イベントを中止しますか？",
                    "参加者に重要変更として通知します。",
                    [
                      { text: "戻る", style: "cancel" },
                      {
                        text: "中止する",
                        style: "destructive",
                        onPress: () =>
                          void act("event_cancel", {
                            revision: event.revision,
                          }),
                      },
                    ],
                  )
                }
              />
            </View>
          )}
        </>
      )}
    </Page>
  );
}
