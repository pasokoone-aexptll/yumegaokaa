import { useState } from "react";
import {
  Animated,
  Image,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { usePushPermission } from "../../hooks/usePushNotifications";
import { useNotifications } from "../../hooks/useNotifications";
import { DetailRow, Section, detail } from "../DetailUI";

export function NotificationsScreen() {
  const push = usePushPermission();
  const { items, error, loading, reading, load, markRead } = useNotifications();
  const [scroll] = useState(() => new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fafafa" }}
      edges={["top"]}
    >
      <StatusBar style="dark" />
      <View
        style={{ height: 44, justifyContent: "center", alignItems: "center" }}
      >
        <Animated.Text
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: "#000000cc",
            opacity: scroll.interpolate({
              inputRange: [160, 210],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          }}
        >
          オラクル通知
        </Animated.Text>
      </View>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scroll } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Animated.View
          style={{
            padding: 20,
            paddingTop: 0,
            opacity: scroll.interpolate({
              inputRange: [0, 190],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          }}
        >
          <Image
            source={require("../../../assets/figma-map/DreamCloud.png")}
            style={{
              width: 180,
              height: 150,
              alignSelf: "flex-start",
              marginBottom: 24,
            }}
            resizeMode="contain"
          />
          <Animated.Text
            style={{
              fontSize: 30,
              fontWeight: "600",
              color: "#00000099",
            }}
          >
            オラクル通知
          </Animated.Text>
          <Text style={{ fontSize: 16, marginTop: 4, color: "#00000044" }}>
            接続センター アシスタント
          </Text>
        </Animated.View>
        <View style={{ paddingHorizontal: 20, gap: 24 }}>
          {!!error && (
            <Text accessibilityRole="alert" style={detail.error}>
              {error}
            </Text>
          )}
          {loading && <ActivityIndicator />}
          {!loading && !error && !items.length && (
            <Text style={detail.secondary}>お知らせはありません。</Text>
          )}
          {(["changed", "canceled"] as const).map((kind) => {
            const notices = items.filter((n) => n.kind === kind);
            if (!notices.length) return null;
            return (
              <View key={kind} style={{ gap: 12 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "600",
                    color: "#00000099",
                  }}
                >
                  {kind === "changed"
                    ? "変更されたイベント"
                    : "中止されたイベント"}
                </Text>
                {notices.map((n) => (
                  <View
                    key={n.id}
                    style={{
                      paddingVertical: 16,
                      gap: 8,
                      borderBottomWidth: 0.5,
                      borderBottomColor: "#00000010",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: n.read ? "500" : "600",
                      }}
                    >
                      {n.title}
                    </Text>
                    <Text style={detail.secondary}>
                      {kind === "canceled"
                        ? "参加予定のイベントが中止されました"
                        : "参加予定のイベントに変更があります"}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#00000066" }}>
                      {new Date(n.created_at).toLocaleString("ja-JP")}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={
                        reading !== null || (kind === "canceled" && n.read)
                      }
                      style={{ paddingVertical: 12, alignSelf: "flex-start" }}
                      onPress={async () => {
                        if ((await markRead(n)) && kind === "changed")
                          router.push({
                            pathname: "/events/[id]",
                            params: { id: n.event_id },
                          });
                      }}
                    >
                      {reading === n.id ? (
                        <ActivityIndicator />
                      ) : (
                        <Text
                          style={{
                            color:
                              n.read && kind === "canceled"
                                ? "#00000055"
                                : "#008cff",
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          {kind === "changed"
                            ? "詳細を確認"
                            : n.read
                              ? "確認済み"
                              : "確認しました"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })}
          <Section>
            <DetailRow
              title={
                push.status === "registered"
                  ? "プッシュ通知は有効です"
                  : "プッシュ通知を有効にする"
              }
              disabled={["unavailable", "registering", "registered"].includes(
                push.status,
              )}
              onPress={() => void push.enable()}
              subtitle={
                push.status === "unavailable"
                  ? "この検証ビルドはプッシュ通知に未対応です。"
                  : push.status === "denied"
                    ? "iPhoneの設定で通知を許可してください。"
                    : push.status === "error"
                      ? "登録できませんでした。再試行してください。"
                      : undefined
              }
            />
          </Section>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
