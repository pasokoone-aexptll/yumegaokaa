import { Text, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Page } from "../components/Page";
import { DenshinLogo } from "../components/icons/SuperAsset";
import { NativeAction } from "../components/denshin/NativeAction";
import { useNotifications } from "../hooks/useNotifications";
export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const d = useNotifications();
  const notice = d.items.find((n) => n.id === id);
  return (
    <Page title="">
      {d.loading && <ActivityIndicator />}
      {notice && (
        <View style={{ gap: 35, paddingTop: 55 }}>
          <DenshinLogo />
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontSize: 27,
              fontWeight: "600",
            }}
          >
            {notice.kind === "pin_closed"
              ? "PINの募集が終了しました"
              : notice.kind === "pin_changed"
                ? "PINが変更されました"
                : notice.kind === "mention"
                  ? "メンションされました"
                  : notice.kind === "canceled"
                    ? "イベントが中止されました"
                    : "イベントが変更されました"}
          </Text>
          <View
            style={{ backgroundColor: "white", padding: 24, borderRadius: 28 }}
          >
            <Text style={{ fontSize: 19 }}>{notice.title}</Text>
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
          <NativeAction
            title="了解しました"
            disabled={d.reading !== null}
            onPress={() => {
              void d.markRead(notice).then((ok) => {
                if (ok) router.back();
              });
            }}
          />
        </View>
      )}
      {!d.loading && !notice && <Text>この通知はありません。</Text>}
      {!!d.error && <Text accessibilityRole="alert">{d.error}</Text>}
    </Page>
  );
}
