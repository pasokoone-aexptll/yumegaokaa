import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  SectionList,
  Text,
  View,
  Pressable,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ReducedIconMotion } from "../icons/IconMotion";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNotifications } from "../../hooks/useNotifications";
import { usePushPermission } from "../../hooks/usePushNotifications";
import { DenshinLogo, SuperAsset } from "../icons/SuperAsset";
import { SpeechBubble } from "../denshin/SpeechBubble";
import { NativeAction } from "../denshin/NativeAction";
export function NotificationsScreen() {
  const router = useRouter();
  const reduced = useContext(ReducedIconMotion);
  const [pinned, setPinned] = useState(false);
  const [date, setDate] = useState("");
  const [fade] = useState(() => new Animated.Value(0));
  const visible = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: { section?: { title: string } }[];
    }) => {
      if (viewableItems[0]?.section?.title)
        setDate(viewableItems[0].section.title);
    },
    [],
  );
  useEffect(() => {
    const animation = Animated.timing(fade, {
      toValue: pinned ? 1 : 0,
      duration: reduced ? 0 : 200,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [pinned, reduced, fade]);
  const push = usePushPermission();
  const d = useNotifications();
  const items = d.items;
  const sections = useMemo(() => {
    const groups = new Map<string, typeof items>();
    for (const item of items
      .filter((n) => !n.read)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))) {
      const date = new Date(item.created_at);
      const key = date.toLocaleDateString("ja-JP");
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }
    return Array.from(groups, ([key, data]) => ({
      key,
      title:
        new Date(data[0].created_at).toDateString() ===
        new Date().toDateString()
          ? "Today"
          : `${new Date(data[0].created_at).getMonth() + 1}/${new Date(data[0].created_at).getDate()}`,
      data,
    }));
  }, [items]);
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#F2F2F2" }}
    >
      <View style={{ padding: 22, height: 115, zIndex: 2 }}>
        <DenshinLogo />
        <View style={{ position: "absolute", left: 92, top: 40 }}>
          <SpeechBubble>
            <Text
              style={{
                color: "#34C759",
                fontFamily: "ui-rounded",
                fontSize: 17,
              }}
            >
              通知
            </Text>
          </SpeechBubble>
        </View>
        <Animated.Text
          style={{
            position: "absolute",
            left: 175,
            top: 30,
            fontFamily: "ui-rounded",
            fontSize: 26,
            fontWeight: "600",
            color: "rgba(0,0,0,0.2)",
            opacity: fade,
            transform: [
              {
                translateY: fade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          {date}
        </Animated.Text>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 30,
            bottom: -30,
          }}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient
                id="notification-fade"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <Stop offset="0" stopColor="#F2F2F2" />
                <Stop offset="1" stopColor="#F2F2F2" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#notification-fade)" />
          </Svg>
        </View>
      </View>
      {!!d.error && <Text accessibilityRole="alert">{d.error}</Text>}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        onViewableItemsChanged={visible}
        onScroll={(event) => setPinned(event.nativeEvent.contentOffset.y > 40)}
        scrollEventThrottle={32}
        refreshing={d.loading}
        onRefresh={() => void d.load()}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 26,
          paddingBottom: 25,
        }}
        renderSectionHeader={({ section }) => (
          <Text
            style={{
              backgroundColor: "#F2F2F2",
              color: "rgba(0,0,0,0.2)",
              fontFamily: "ui-rounded",
              fontWeight: "600",
              fontSize: 26,
              paddingVertical: 18,
            }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/inbox/[id]", params: { id: item.id } })
            }
            style={{ paddingVertical: 20, gap: 12 }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <SuperAsset
                name={
                  item.kind === "mention" ? "非常口から人が出るrounded" : "電信"
                }
                width={item.kind === "mention" ? 40 : 60}
                height={40}
              />
              <Text
                style={{
                  flex: 1,
                  fontFamily: "ui-rounded",
                  fontSize: 18,
                  color: "rgba(0,0,0,0.7)",
                  fontWeight: "600",
                }}
              >
                {item.kind === "pin_closed"
                  ? "PINの募集が終了しました"
                  : item.kind === "pin_changed"
                    ? "PINが変更されました"
                    : item.kind === "mention"
                      ? "メンションされました"
                      : item.kind === "canceled"
                        ? "イベントが中止されました"
                        : "イベントが変更されました"}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: "rgba(0,0,0,0.5)" }}>
              {item.title}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          d.loading ? (
            <ActivityIndicator />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 30,
              }}
            >
              <SuperAsset name="非常口から人が出る" width={210} height={270} />
              <Text style={{ color: "rgba(0,0,0,0.2)", fontSize: 18 }}>
                まだ何もありません
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          push.status === "registered" ||
          push.status === "unavailable" ? undefined : (
            <NativeAction
              title="プッシュ通知を有効にする"
              disabled={push.status === "registering"}
              onPress={() => void push.enable()}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
