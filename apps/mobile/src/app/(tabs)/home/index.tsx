import type { ComponentRef } from "react";
import { homePinSections } from "../../../lib/homePinSections";
import { pin as reviewPin } from "../../../components/debug/figmaFixtures";
import { useDelayedRefreshStatus } from "../../../hooks/useDelayedRefreshStatus";
import { HomeModeDropdown } from "../../../components/HomeModeDropdown";
import { useInviteQuota } from "../../../hooks/useInviteQuota";
import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { reviewEnabled } from "../../../components/debug/reviewEnabled";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDenshinPins } from "../../../hooks/useDenshinPins";
import { Avatar } from "../../../components/Avatar";
import { PeopleStack, green } from "../../../components/denshin/PinParts";
import {
  onsitePeople,
  denshinError,
  HiddenAttendance,
} from "../../../lib/denshin";
import { openMapAt, openMapPinComposer } from "../../../lib/mapNavigation";
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
  const livePins = useDenshinPins();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { reviewEmpty, reviewAttending, reviewScroll } = useLocalSearchParams<{
    reviewEmpty?: string;
    reviewAttending?: string;
    reviewScroll?: string;
  }>();
  // Opt-in Simulator presentation only; neither writes nor changes server data.
  const pins =
    reviewEnabled && reviewEmpty === "1"
      ? {
          ...livePins,
          items: [],
          hidden_attendance: [],
          loading: false,
          error: "",
        }
      : reviewEnabled && reviewAttending === "1"
        ? {
            ...livePins,
            items: Array.from(
              { length: reviewScroll === "1" ? 12 : 1 },
              (_, index) => ({
                ...reviewPin,
                id: `${reviewPin.id}-${index}`,
                attendance: "arrived" as const,
                mine: false,
              }),
            ),
            hidden_attendance: [],
            loading: false,
            error: "",
          }
        : livePins;
  const waiting = useDelayedRefreshStatus(!!pins.error);
  const remaining = useInviteQuota();
  const { width } = useWindowDimensions();
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
          "参加状態を更新しました",
          "参加を取り消すには、もう一度タップしてください。",
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
    <View style={s.page}>
      <Image
        pointerEvents="none"
        source={require("../../../../assets/superassets/DreamCloud背景.png")}
        style={{
          position: "absolute",
          top: width * 1.07,
          right: -4,
          width: width * 0.62,
          height: width * 0.62,
          opacity: 1,
        }}
        resizeMode="contain"
      />
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() => {
          if (reviewEnabled && reviewScroll === "1")
            scrollRef.current?.scrollTo({ y: 200, animated: false });
        }}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(0, insets.top - 6),
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <DenshinLogo />
            <HomeModeDropdown />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="電信PINを作成"
            onPress={() => openMapPinComposer(router)}
            style={s.add}
          >
            <SuperAsset name="add" tint="black" size={24} />
          </Pressable>
        </View>
        <View style={[s.content, !pins.items.length && { flex: 1 }]}>
          {waiting && (
            <Text accessibilityLiveRegion="polite" style={s.refreshStatus}>
              PINを更新しています…
            </Text>
          )}
          {pins.loading && <ActivityIndicator />}
          {!pins.loading && !pins.error && !pins.items.length && (
            <View style={s.empty}>
              <SuperAsset name="pin-none" width={102} height={92} />
              <Text style={s.emptyText}>PINがまだありません</Text>
            </View>
          )}
          {homePinSections(pins.items).map((section) => (
            <View key={section.key} style={s.section}>
              <SpeechBubble>
                <SuperAsset
                  name="非常口rounded"
                  size={21}
                  tint={section.highlighted ? green : "rgba(0,0,0,0.65)"}
                />
                <Text
                  style={[
                    s.sectionTitle,
                    section.highlighted && { color: green },
                  ]}
                >
                  {section.title}
                </Text>
              </SpeechBubble>
              {section.items.map((p, index) => (
                <View key={p.id} style={s.row}>
                  {index > 0 && <View style={s.separator} />}
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
                      size={49 * 1.3}
                    />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.metadata}>
                        {p.mine ? "自分" : p.display_name}
                        {p.recruiting && (
                          <Text>
                            {" "}
                            ・ {p.count}
                            <Text style={{ fontSize: 9 }}>
                              {p.capacity === null ? "人" : `/${p.capacity}人`}
                            </Text>
                          </Text>
                        )}
                        {p.attendance === "planned"
                          ? " ・ 参加予定"
                          : p.attendance === "arrived"
                            ? " ・ 現地にいます"
                            : ""}
                      </Text>
                      <Text style={s.body} numberOfLines={2}>
                        {p.body}
                      </Text>
                      <View style={s.location}>
                        <SuperAsset
                          name="nav"
                          tint="black"
                          opacity={0.3}
                          size={10 * 1.2}
                        />
                        <Text style={s.locationText}>位置を確認する</Text>
                      </View>
                    </View>
                    <View style={{ alignSelf: "center" }}>
                      <PeopleStack
                        people={onsitePeople(p)}
                        borderColor={s.page.backgroundColor}
                      />
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
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="招待QRで友達を招待"
        onPress={() => router.push("/home/invitations")}
        style={{
          margin: 16,
          marginTop: 12,
          minHeight: 75,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 17,
          overflow: "hidden",
          backgroundColor: "#FF5577",
        }}
      >
        <View style={{ paddingHorizontal: 13, paddingVertical: 12 }}>
          <SuperAsset
            name="非常口rounded"
            size={49}
            tint="white"
            opacity={0.8}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontWeight: "600",
              color: "white",
              fontSize: 14,
              lineHeight: 18,
            }}
          >
            招待QRで友達を招待しよう！
          </Text>
          {remaining !== undefined && (
            <Text
              style={{
                alignSelf: "flex-start",
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 20,
                backgroundColor: "#F13450",
                color: "white",
                fontFamily: "ui-rounded",
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              残り{remaining}招待
            </Text>
          )}
        </View>
        <View
          style={{
            alignSelf: "stretch",
            width: "20%",
            backgroundColor: "rgba(255,255,255,0.3)",
            borderLeftWidth: 2,
            borderColor: "rgba(255,255,255,0.7)",
            borderStyle: "dashed",
          }}
        />
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F2F2F2" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginBottom: 52,
  },
  add: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 20 },
  empty: {
    flex: 1,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  emptyText: {
    fontFamily: "ui-rounded",
    fontSize: 16,
    color: "rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  section: { marginBottom: 28, gap: 5 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 0,
    alignSelf: "center",
    lineHeight: 21,
    fontFamily: "ui-rounded",
  },
  row: {
    paddingVertical: 9,
  },
  main: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  body: {
    fontFamily: "ui-rounded",
    fontSize: 17.5,
    fontWeight: "500",
    color: "black",
    lineHeight: 22,
  },
  muted: {
    fontFamily: "ui-rounded",
    fontSize: 13,
    color: "rgba(0,0,0,0.35)",
    lineHeight: 17,
  },
  metadata: {
    fontFamily: "ui-rounded",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "600",
    color: "rgba(0,0,0,0.35)",
  },
  location: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: {
    fontFamily: "ui-rounded",
    fontSize: 10 * 1.2,
    lineHeight: 14 * 1.2,
    color: "rgba(0,0,0,0.3)",
  },
  separator: {
    position: "absolute",
    left: 49 * 1.3 + 12,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  refreshStatus: {
    position: "absolute",
    top: -22,
    left: 20,
    color: "rgba(0,0,0,0.45)",
    fontSize: 12,
    fontFamily: "ui-rounded",
  },
});
