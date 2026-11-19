import { Text, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailPage } from "../components/DetailUI";
import {
  NoticeHeading,
  NoticeSubject,
} from "../components/notifications/NoticeContent";
import { NativeAction } from "../components/denshin/NativeAction";
import { useNotifications } from "../hooks/useNotifications";
export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = useNotifications();
  return <NoticeDetailView data={d} id={id} />;
}
export function NoticeDetailView({
  data: d,
  id,
}: {
  data: ReturnType<typeof useNotifications>;
  id: string;
}) {
  const router = useRouter();
  const notice = d.items.find((n) => n.id === id);
  return (
    <DetailPage title="">
      {d.loading && <ActivityIndicator />}
      {notice && (
        <View style={{ gap: 35, paddingTop: 55 }}>
          <View style={{ paddingHorizontal: 16 }}>
            <NoticeHeading notice={notice} large />
          </View>
          <View style={{ marginHorizontal: 5 }}>
            <NoticeSubject notice={notice} detail />
          </View>
          {(notice.kind === "pin_changed" ||
            notice.kind === "changed" ||
            notice.kind === "mention") && (
            <NativeAction
              title="対象を開く"
              onPress={() => {
                if (notice.pin_id)
                  router.push({
                    pathname: "/map-pin",
                    params: { id: notice.pin_id },
                  });
                else if (notice.kind === "mention") router.push("/(tabs)");
                else
                  router.push({
                    pathname: "/events/[id]",
                    params: { id: notice.event_id },
                  });
              }}
            />
          )}
          <View style={{ marginTop: 58 }}>
            <NativeAction
              tone="blue"
              title="了解しました"
              disabled={d.reading !== null}
              onPress={() => {
                void d.markRead(notice).then((ok) => {
                  if (ok) router.back();
                });
              }}
            />
          </View>
        </View>
      )}
      {!d.loading && !notice && <Text>この通知はありません。</Text>}
      {!!d.error && <Text accessibilityRole="alert">{d.error}</Text>}
    </DetailPage>
  );
}
