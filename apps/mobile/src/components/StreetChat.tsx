import { useEffect, useRef, useState, type ComponentRef } from "react";
import { BlurView } from "expo-blur";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { GridBackground } from "./GridBackground";
import { MapAsset } from "./map/MapAsset";
import { MapFeedback, type MapNotice } from "./map/MapFeedback";
import { SmoothSurface } from "./map/SmoothSurface";
import { router } from "expo-router";
import {
  Animated,
  Easing,
  Keyboard,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useStreetChat, type Message } from "../hooks/useStreetChat";

export function StreetChat({ mapError = "" }: { mapError?: string }) {
  const {
    pending,
    revise,
    restoring,
    restoreFailed,
    restore,
    chatRestrictedUntil,
    hasNew,
    followLatest,
    readingHistory,
    items,
    text,
    setText,
    error,
    busy,
    expanded,
    loading,
    send,
    action,
    beginHistory,
    endHistoryDrag,
    loadMore,
    reload,
  } = useStreetChat();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [availableHeight, setAvailableHeight] = useState(height);
  const [footerHeight, setFooterHeight] = useState(66);
  const historyViewportHeight = Math.max(
    0,
    Math.min(height * 0.74, availableHeight) - footerHeight,
  );
  const [awayFromLatest, setAwayFromLatest] = useState(false);
  const [expansion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(expansion, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, expansion]);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const notice: MapNotice | null = mapError
    ? { title: "通信・参加状態", message: mapError }
    : busy
      ? {
          title: "送信を確認中",
          message: "送信結果を確認しています。",
          busy: true,
        }
      : restoreFailed
        ? {
            title: "送信状態を確認できません",
            message: "前回の送信を確認してから再開してください。",
            actions: [{ title: "再取得", onPress: () => void restore() }],
          }
        : pending
          ? {
              title: "送信結果が未確認です",
              message: error || "同じ送信の結果を確認できます。",
              actions: [
                { title: "結果を確認", onPress: () => void send() },
                {
                  title: "未確定の送信を取り消して編集",
                  onPress: () => void revise(),
                },
              ],
            }
          : error
            ? {
                title: "通信エラー",
                message: error,
                actions: [{ title: "再読み込み", onPress: reload }],
              }
            : chatRestrictedUntil
              ? {
                  title: "投稿制限中",
                  message: `${new Date(chatRestrictedUntil).toLocaleString()}まで投稿できません。`,
                }
              : null;
  function menu(m: Message) {
    Alert.alert(m.display_name, "操作を選択", [
      ...(m.mine && m.kind === "text" && !m.deleted
        ? [
            {
              text: "削除",
              style: "destructive" as const,
              onPress: () => void action("chat_delete", { id: m.id }),
            },
          ]
        : []),
      ...(!m.mine && m.author_id
        ? [
            {
              text: "ブロック",
              onPress: () =>
                void action("block_set", {
                  account_id: m.author_id,
                  blocked: true,
                }),
            },
          ]
        : []),
      ...(m.kind === "text" && !m.deleted
        ? [
            {
              text: "通報",
              onPress: () =>
                router.push({
                  pathname: "/report",
                  params: { kind: "message", id: m.id },
                }),
            },
          ]
        : []),
      { text: "閉じる", style: "cancel" },
    ]);
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        pointerEvents={expanded ? "auto" : "none"}
        onTouchStart={Keyboard.dismiss}
        style={[StyleSheet.absoluteFill, { opacity: expansion }]}
      >
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior="height"
        style={{ flex: 1 }}
        pointerEvents="box-none"
      >
        <SafeAreaView
          edges={["top"]}
          pointerEvents="box-none"
          style={{ flex: 1, justifyContent: "flex-end" }}
          onLayout={({ nativeEvent }) =>
            setAvailableHeight(
              Math.max(0, nativeEvent.layout.height - insets.top),
            )
          }
        >
          <Animated.View
            style={{
              height: expansion.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  Math.min(height * 0.36, availableHeight),
                  Math.min(height * 0.74, availableHeight),
                ],
              }),
              maxHeight: "100%",
              flexShrink: 1,
            }}
          >
            <View style={styles.history} onTouchStart={Keyboard.dismiss}>
              <GridBackground color="#ffffff18" />
              <ScrollView
                ref={scroll}
                // Keep the native scroll viewport fixed while the parent reveals it.
                // Resizing its top edge during a drag moves the touched row away from the finger.
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: historyViewportHeight,
                }}
                maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
                onContentSizeChange={() => {
                  if (!readingHistory.current)
                    scroll.current?.scrollToEnd({ animated: false });
                }}
                scrollEventThrottle={32}
                onScroll={({
                  nativeEvent: {
                    contentOffset,
                    contentSize,
                    layoutMeasurement,
                  },
                }) => {
                  setAwayFromLatest(
                    contentSize.height -
                      layoutMeasurement.height -
                      contentOffset.y >
                      48,
                  );
                }}
                onScrollBeginDrag={beginHistory}
                onScrollEndDrag={endHistoryDrag}
                onTouchCancel={endHistoryDrag}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                contentContainerStyle={{
                  minHeight: historyViewportHeight,
                  justifyContent: "flex-end",
                  paddingHorizontal: 12,
                  paddingBottom: 64,
                }}
              >
                <Pressable onPress={loadMore} accessibilityRole="button">
                  <Text style={styles.more}>過去の会話を読む</Text>
                </Pressable>
                {loading && <ActivityIndicator color="#b0b7c2" />}
                {!loading && !error && !items.length && (
                  <Text style={styles.more}>まだ会話はありません</Text>
                )}
                {[...items].reverse().map((m) => (
                  <Pressable
                    key={m.id}
                    onLongPress={() => menu(m)}
                    style={styles.message}
                  >
                    <Avatar
                      path={m.avatar_path}
                      version={m.avatar_updated_at}
                      name={m.display_name}
                      size={34}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.author}>
                        {m.display_name}{" "}
                        {new Date(m.created_at).toLocaleTimeString()}
                      </Text>
                      <Text style={styles.body}>
                        {m.deleted
                          ? "削除されたメッセージ"
                          : m.kind === "arrival"
                            ? "街に参加しました"
                            : m.body}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <View pointerEvents="none" style={styles.watermark}>
                <MapAsset name="DreamCloud Logo" width={147} height={22} />
              </View>
              {(hasNew || awayFromLatest) && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Keyboard.dismiss();
                    followLatest();
                    setAwayFromLatest(false);
                    scroll.current?.scrollToEnd({ animated: true });
                  }}
                  style={styles.new}
                >
                  <SmoothSurface
                    color="#303d50f0"
                    radius={18}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: "#e4edff" }}>最新へ</Text>
                    <View style={{ transform: [{ rotate: "90deg" }] }}>
                      <MapAsset name="chevron.right" size={12} />
                    </View>
                  </SmoothSurface>
                </Pressable>
              )}
            </View>
            <View
              onLayout={({ nativeEvent }) =>
                setFooterHeight(nativeEvent.layout.height)
              }
            >
              {notice && (
                <MapFeedback
                  key={notice.title + notice.message}
                  notice={notice}
                />
              )}
              <View style={styles.composer} onTouchStart={Keyboard.dismiss}>
                <SmoothSurface
                  color="#686868a8"
                  radius={18}
                  style={styles.inputRow}
                >
                  <TextInput
                    onTouchStart={(event) => event.stopPropagation()}
                    placeholder="入力…"
                    placeholderTextColor="#a1a1a1"
                    maxLength={500}
                    value={text}
                    onChangeText={setText}
                    accessibilityLabel="街のチャットに入力"
                    style={styles.input}
                    editable={!pending && !restoring && !restoreFailed && !busy}
                  />
                  {!text && (
                    <View pointerEvents="none" style={styles.inputHint}>
                      <Text style={styles.hint}>街ローカルチャット</Text>
                      <MapAsset name="chevron.right" size={12} />
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={pending ? "送信結果を確認" : "送信"}
                    disabled={
                      busy ||
                      restoring ||
                      restoreFailed ||
                      !!chatRestrictedUntil ||
                      !text.trim()
                    }
                    onPress={() => void send()}
                    style={[styles.send, { opacity: !text.trim() ? 0.4 : 1 }]}
                  >
                    {busy || restoring ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.arrow}>↑</Text>
                    )}
                  </Pressable>
                </SmoothSurface>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  history: { flex: 1, backgroundColor: "#171c2475", overflow: "hidden" },
  message: { paddingVertical: 7, flexDirection: "row", gap: 10 },
  author: { color: "#9da4b1", fontSize: 12, fontWeight: "600" },
  body: { color: "#e1e1e5", fontSize: 15, lineHeight: 21, fontWeight: "500" },
  more: { color: "#a9b2c1", fontSize: 12, paddingVertical: 7 },
  watermark: { position: "absolute", right: 12, bottom: 10, opacity: 0.35 },
  new: { position: "absolute", right: 12, bottom: 10 },
  composer: { backgroundColor: "#343434ed", padding: 10 },
  inputRow: { flexDirection: "row", minHeight: 46, alignItems: "center" },
  input: {
    flex: 1,
    minWidth: 0,
    color: "white",
    paddingLeft: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputHint: {
    position: "absolute",
    right: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hint: { color: "#b7b7b7", fontSize: 12 },
  send: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  arrow: { color: "white", fontSize: 32, lineHeight: 36, fontWeight: "800" },
});
