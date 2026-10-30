import { useCallback, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Action, Empty, Page, ui } from "../../components/Page";
import { native } from "../../lib/native";
import { StreetEvent } from "../../lib/events";
export default function Event() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<StreetEvent>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [roster, setRoster] =
      useState<{ account_id: string; display_name: string }[]>(),
    [newEnd, setNewEnd] = useState("");
  const load = useCallback(async () => {
    try {
      const e = await native.rpc<StreetEvent>("event_get", { id });
      setEvent(e);
      setNewEnd(e.ends_at);
      setError("");
    } catch {
      setEvent(undefined);
      setError(
        "イベントを取得できません。終了・中止されたか、接続を確認する必要があります。",
      );
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function act(operation: string, p: Record<string, unknown>) {
    setBusy(true);
    try {
      await native.rpc(operation, { id, ...p });
      await load();
    } catch {
      setError(
        "操作できませんでした。満席・変更・通信状態を確認し、最新内容を再取得してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={event?.title ?? "オフ会"}>
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action title="最新情報を取得" onPress={() => void load()} />
      {!event ? (
        <Empty>参加を確認するにはイベントの情報が必要です。</Empty>
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
            disabled={busy || (!event.joined && event.count >= event.capacity)}
            onPress={() =>
              void act("event_register", {
                joined: !event.joined,
                revision: event.registration_revision,
              })
            }
          />
          {event.mine && (
            <View style={ui.card}>
              <Text>主催者の操作</Text>
              <Action
                title="参加者一覧"
                onPress={() =>
                  void native
                    .rpc<{
                      items: { account_id: string; display_name: string }[];
                    }>("event_roster", { id })
                    .then((r) => setRoster(r.items))
                    .catch(() => setError("名簿を取得できません。"))
                }
              />
              {roster?.map((p) => (
                <Text key={p.account_id}>{p.display_name}</Text>
              ))}
              <TextInput
                style={ui.input}
                value={newEnd}
                onChangeText={setNewEnd}
                placeholder="終了日時"
              />
              <Action
                title="終了日時を更新"
                disabled={busy}
                onPress={() => {
                  const d = new Date(newEnd);
                  if (!Number.isFinite(d.getTime())) {
                    setError("日時を確認してください。");
                    return;
                  }
                  void act("event_edit", {
                    ...event,
                    ends_at: d.toISOString(),
                  });
                }}
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
