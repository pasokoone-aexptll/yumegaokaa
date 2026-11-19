import { useInviteQuota } from "../../../hooks/useInviteQuota";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDenshinPins } from "../../../hooks/useDenshinPins";
import { Avatar } from "../../../components/Avatar";
import { PeopleStack, green } from "../../../components/denshin/PinParts";
import {
  onsitePeople,
  pinCount,
  denshinError,
  HiddenAttendance,
} from "../../../lib/denshin";
import { openMapAt } from "../../../lib/mapNavigation";
import {
  cancelPendingCommand,
  pendingCommand,
  submitCommand,
} from "../../../lib/commands";
import { DenshinLogo, SuperAsset } from "../../../components/icons/SuperAsset";
import { SpeechBubble } from "../../../components/denshin/SpeechBubble";
export default function Home() {
  const router = useRouter(),
    insets = useSafeAreaInsets();
  const pins = useDenshinPins();
  const remaining = useInviteQuota();
  const [refreshing, setRefreshing] = useState(false),
    [leaving, setLeaving] = useState(false);
  async function refresh() {
    setRefreshing(true);
    try {
      await pins.load(true);
    } finally {
      setRefreshing(false);
    }
  }
  async function leave(p: HiddenAttendance) {
    if (leaving) return;
    setLeaving(true);
    try {
      const old = await pendingCommand("denshin_attend");
      if (old) {
        await cancelPendingCommand("denshin_attend");
        await pins.load(true);
        Alert.alert(
          "前回の送信結果を確認しました",
          "最新の参加状態を確認して、もう一度取り消してください。",
        );
        return;
      }
      await submitCommand("denshin_attend", {
        id: p.id,
        revision: p.revision,
        attendance_revision: p.attendance_revision,
        state: "left",
      });
      await pins.load(true);
    } catch (e) {
      Alert.alert("参加取消を確認できません", denshinError(e));
    } finally {
      setLeaving(false);
    }
  }
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 25,
        paddingBottom: 0,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
        />
      }
    >
      <View style={s.header}>
        <DenshinLogo />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="電信PINを作成"
          onPress={() => router.push("/pins/create")}
          style={s.add}
        >
          <SuperAsset name="add" tint="black" size={24} />
        </Pressable>
      </View>
      <View style={s.content}>
        {!!pins.error && (
          <Text accessibilityRole="alert" style={s.error}>
            {pins.error}
          </Text>
        )}
        {pins.loading && <ActivityIndicator />}
        {[true, false].map((recruiting) => (
          <View key={String(recruiting)} style={s.section}>
            <SpeechBubble>
              <SuperAsset
                name="非常口rounded"
                tint={recruiting ? green : "rgba(0,0,0,0.65)"}
              />
              <Text style={[s.sectionTitle, recruiting && { color: green }]}>
                {recruiting ? "募集中" : "PIN / 予約募集"}
              </Text>
            </SpeechBubble>
            {!pins.loading &&
              !pins.error &&
              !pins.items.some((p) => p.recruiting === recruiting) && (
                <Text style={s.muted}>まだありません</Text>
              )}
            {pins.items
              .filter((p) => p.recruiting === recruiting)
              .map((p) => (
                <View key={p.id} style={s.row}>
                  <Pressable
                    style={s.main}
                    onPress={() =>
                      openMapAt(router, p.longitude, p.latitude, {
                        kind: "denshin",
                        id: p.id,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${p.body}の詳細`}
                  >
                    <Avatar
                      shape="square"
                      path={p.avatar_path}
                      name={p.display_name}
                      size={48}
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={s.muted}>
                        {p.mine ? "自分" : p.display_name}
                        {p.recruiting ? ` ・ ${pinCount(p)}` : ""}
                        {p.attendance === "planned"
                          ? " ・ 参加予定"
                          : p.attendance === "arrived"
                            ? " ・ 現地にいます"
                            : ""}
                      </Text>
                      <Text style={s.body} numberOfLines={2}>
                        {p.body}
                      </Text>
                    </View>
                    <PeopleStack people={onsitePeople(p)} />
                  </Pressable>
                  <Pressable
                    style={s.location}
                    accessibilityRole="button"
                    onPress={() =>
                      openMapAt(router, p.longitude, p.latitude, {
                        kind: "denshin",
                        id: p.id,
                      })
                    }
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <SuperAsset
                        name="nav"
                        tint="black"
                        opacity={0.3}
                        size={12}
                      />
                      <Text style={s.muted}>位置を確認する</Text>
                    </View>
                  </Pressable>
                </View>
              ))}
          </View>
        ))}
        {pins.hidden_attendance.map((p) => (
          <View key={p.id} style={s.row}>
            <Text style={s.muted}>非表示の電信PINに参加中</Text>
            <Pressable disabled={leaving} onPress={() => void leave(p)}>
              <Text style={s.body}>
                {p.attendance === "arrived"
                  ? "現地を離れる"
                  : "参加予定を取り消す"}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={{ flex: 1, minHeight: 40 }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="招待QRで友達を招待"
        onPress={() => router.push("/home/invitations")}
        style={{
          margin: 16,
          marginTop: 12,
          minHeight: 76,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#FF5577",
        }}
      >
        <View style={{ padding: 15 }}>
          <SuperAsset
            name="非常口rounded"
            size={46}
            tint="white"
            opacity={0.8}
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontWeight: "600",
              color: "white",
              fontSize: 17,
            }}
          >
            招待QRで友達を招待しよう！
          </Text>
          {remaining !== undefined && (
            <Text
              style={{
                alignSelf: "flex-start",
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 20,
                backgroundColor: "rgba(255,0,45,0.3)",
                color: "white",
                fontFamily: "ui-rounded",
                fontSize: 14,
              }}
            >
              残り{remaining}招待
            </Text>
          )}
        </View>
        <View
          style={{
            alignSelf: "stretch",
            width: 58,
            backgroundColor: "rgba(255,255,255,0.3)",
            borderLeftWidth: 2,
            borderColor: "rgba(255,255,255,0.7)",
            borderStyle: "dashed",
          }}
        />
      </Pressable>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "rgba(0,0,0,0.05)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginBottom: 46,
  },
  add: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 20 },
  section: { marginBottom: 30, gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 0,
    alignSelf: "flex-start",
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#00000018",
  },
  main: { flexDirection: "row", alignItems: "center", gap: 12 },
  body: { fontSize: 16, color: "#111", lineHeight: 23 },
  muted: { fontSize: 12, color: "#999", lineHeight: 17 },
  location: { marginLeft: 60, minHeight: 32, justifyContent: "center" },
  error: { color: "#b22", paddingVertical: 12 },
});
