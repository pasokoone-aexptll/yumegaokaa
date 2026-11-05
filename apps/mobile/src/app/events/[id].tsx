import { openMapAt } from "../../lib/mapNavigation";
import { Alert, ActivityIndicator, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  DetailPage,
  DetailRow,
  Section,
  PrimaryAction,
  detail,
} from "../../components/DetailUI";
import { useEventDetail } from "../../hooks/useEventDetail";
export default function Event() {
  const { id, fromMap } = useLocalSearchParams<{
    id: string;
    fromMap?: string;
  }>();
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
    <DetailPage
      mapSheet={fromMap === "1"}
      title={event?.title ?? "オフ会"}
      refreshing={busy || loading}
      onRefresh={canceled ? undefined : load}
    >
      {!!error && (
        <Text accessibilityRole="alert" style={detail.error}>
          {error}
        </Text>
      )}
      {!event ? (
        <Text style={detail.secondary}>
          {canceled
            ? "イベントを中止しました"
            : loading
              ? "読み込み中…"
              : "イベントを表示できません"}
        </Text>
      ) : (
        <>
          <Section>
            <DetailRow
              icon="calendar-outline"
              title={new Date(event.starts_at).toLocaleDateString("ja-JP", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
              subtitle={`${new Date(event.starts_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} 〜 ${new Date(event.ends_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
            />
            {fromMap !== "1" && (
              <DetailRow
                icon="location-outline"
                title="開催場所"
                subtitle="地図で見る"
                onPress={() =>
                  openMapAt(event.longitude, event.latitude, {
                    kind: "event",
                    id,
                  })
                }
              />
            )}
            <DetailRow
              icon="people-outline"
              title={`${event.count}人が参加予定`}
              subtitle={`定員 ${event.capacity}人`}
            />
          </Section>
          {event.joined ? (
            <Section>
              <DetailRow icon="checkmark-circle-outline" title="参加予定" />
              <DetailRow
                title="参加を取り消す"
                disabled={busy || loading}
                onPress={() =>
                  void act("event_register", {
                    joined: false,
                    revision: event.registration_revision,
                  })
                }
              />
            </Section>
          ) : (
            <PrimaryAction
              title={event.count >= event.capacity ? "満員" : "参加する"}
              disabled={busy || loading || event.count >= event.capacity}
              onPress={() =>
                act("event_register", {
                  joined: true,
                  revision: event.registration_revision,
                })
              }
            />
          )}
          {!!event.description && (
            <Section title="イベントについて">
              <Text style={[detail.body, { padding: 16 }]}>
                {event.description}
              </Text>
            </Section>
          )}
          {(event.mine || operator) && (
            <Section title="参加者">
              {rosterLoading ? (
                <ActivityIndicator style={{ padding: 20 }} />
              ) : roster === undefined ? (
                <DetailRow
                  title="参加者を再読み込み"
                  onPress={() => void loadRoster()}
                />
              ) : roster.length === 0 ? (
                <DetailRow title="参加者はまだいません" />
              ) : (
                roster.map((p) => (
                  <DetailRow
                    key={p.account_id}
                    icon="person-circle-outline"
                    title={p.display_name}
                  />
                ))
              )}
              {operator && !!error && (
                <DetailRow
                  title="運営の追加認証"
                  onPress={() => router.push("/admin")}
                />
              )}
            </Section>
          )}
          {event.mine && (
            <Section title="主催者の管理">
              <DetailRow
                icon="create-outline"
                title="イベントを編集"
                disabled={busy || loading}
                onPress={() =>
                  router.push({ pathname: "/events/edit/[id]", params: { id } })
                }
              />
              <DetailRow
                icon="close-circle-outline"
                title="イベントを中止"
                danger
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
            </Section>
          )}
          <Section>
            <DetailRow
              icon="flag-outline"
              title="このイベントを通報"
              onPress={() =>
                router.push({
                  pathname: "/report",
                  params: { kind: "event", id },
                })
              }
            />
          </Section>
        </>
      )}
    </DetailPage>
  );
}
