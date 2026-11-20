import { ReviewAvatars } from "../../../components/debug/ReviewAvatars";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { reviewEnabled } from "../../../components/debug/reviewEnabled";
import {
  noticeData,
  notices,
  done,
  emailData,
  operator,
  people,
} from "../../../components/debug/figmaFixtures";
import { NotificationsView } from "../../../components/map/NotificationsScreen";
import { NoticeDetailView } from "../../notice";
import { BlocksView } from "../../blocks";
import { AccountView } from "../../account";
import { AdminView } from "../../admin";
const scenarios = [
  ["notices", "14 通知一覧 / 15 日付固定"],
  ["notice", "16 通知詳細"],
  ["block", "24 ブロック候補"],
  ["blocked", "25 ブロック一覧"],
  ["otp", "28 コード入力→成功"],
  ["admin", "29 運営"],
];
export default function VisualReview() {
  return reviewEnabled ? (
    <ReviewAvatars>
      <View style={{ flex: 1 }}>
        <Scenes />
        <ReviewNavigation />
      </View>
    </ReviewAvatars>
  ) : null;
}
function Scenes() {
  const { scene } = useLocalSearchParams<{ scene?: string }>();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  if (scene === "notices")
    return (
      <NotificationsView
        data={noticeData([
          ...notices,
          ...notices.map((n) => ({
            ...n,
            id: n.id + "-older",
            created_at: new Date(
              Date.parse(notices[0].created_at) - 2 * 86400000,
            ).toISOString(),
          })),
        ])}
        push={{ status: "unavailable", enable: done }}
        onOpen={(id) =>
          router.push({
            pathname: "/settings/review",
            params: { scene: "notice", id },
          })
        }
      />
    );
  if (scene === "notice")
    return <NoticeDetailView data={noticeData()} id={notices[2].id} />;
  if (scene === "block" || scene === "blocked")
    return (
      <BlocksView
        name={scene === "block" ? "nyan_x" : undefined}
        data={{
          items: [{ ...people[0], display_name: "nyan_x" }],
          loading: false,
          error: "",
          busy: false,
          refresh: done,
          update: async () => false,
        }}
      />
    );
  if (scene === "otp")
    return (
      <AccountView
        editing="1"
        data={{
          ...emailData(code, complete),
          busy,
          setOldCode: setCode,
          verify: async () => {
            setBusy(true);
            await new Promise((r) => setTimeout(r, 700));
            setBusy(false);
            setComplete(true);
          },
        }}
      />
    );
  if (scene === "admin") return <AdminView dashboard={operator} />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView contentContainerStyle={{ padding: 26, gap: 16 }}>
        <Text>Simulator視覚確認 · 実データの変更なし</Text>
        <Pressable
          onPress={() => router.push("/review-onboarding")}
          style={{ padding: 16 }}
        >
          <Text>30 オンボーディング動画</Text>
        </Pressable>
        {scenarios.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() =>
              router.push({
                pathname: "/settings/review",
                params: { scene: key },
              })
            }
            style={{
              padding: 16,
              backgroundColor: "rgba(0,0,0,0.05)",
              borderRadius: 18,
            }}
          >
            <Text>{label}</Text>
          </Pressable>
        ))}
        {["half", "full", "planned", "confirmed", "normal", "empty"].map(
          (scene) => (
            <Pressable
              key={scene}
              onPress={() => {
                router.navigate("/(tabs)");
                setTimeout(
                  () =>
                    router.push({ pathname: "/review-pin", params: { scene } }),
                  350,
                );
              }}
              style={{ padding: 16 }}
            >
              <Text>PIN {scene}</Text>
            </Pressable>
          ),
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewNavigation() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="確認一覧へ戻る"
      onPress={() => router.setParams({ scene: "" })}
      style={{ position: "absolute", top: 8, right: 8, padding: 8 }}
    >
      <Text style={{ fontSize: 10, color: "rgba(0,0,0,0.25)" }}>REVIEW</Text>
    </Pressable>
  );
}
