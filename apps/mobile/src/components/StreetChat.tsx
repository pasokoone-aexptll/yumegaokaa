import { useEffect, useRef, useState, type ComponentRef } from "react";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
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
  const collapsedHeight = Math.min(height * 0.36, availableHeight);
  const expandedHeight = Math.min(height * 0.74, availableHeight);
  const historyViewportHeight = Math.max(0, expandedHeight - footerHeight);
  const collapsedHistoryHeight = Math.max(0, collapsedHeight - footerHeight);
  // Reserve the clipped region even while expanded. Changing this during a drag
  // would move the touched message again. At offset zero, the first row is visible
  // just below the collapsed window's top edge on every screen size.
  const historyTopPadding = historyViewportHeight - collapsedHistoryHeight;
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
                outputRange: [collapsedHeight, expandedHeight],
              }),
              maxHeight: "100%",
              flexShrink: 1,
            }}
          >
            <View style={styles.history} onTouchStart={Keyboard.dismiss}>
              <BlurView
                pointerEvents="none"
                intensity={18}
                tint="default"
                style={StyleSheet.absoluteFill}
              />
              <Svg
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
              >
                <Defs>
                  <LinearGradient id="chatShade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="black" stopOpacity={0.12} />
                    <Stop offset="1" stopColor="black" stopOpacity={0.78} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#chatShade)" />
              </Svg>
              <GridBackground color="#ffffff18" spacing={29} />
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
                  paddingTop: historyTopPadding,
                  paddingBottom: 64,
                }}
              >
                <Pressable onPress={loadMore} accessibilityRole="button">
                  <Text style={styles.more}>過去の会話を読む</Text>
                </Pressable>
                {loading && <ActivityIndicator color="#ffffff80" />}
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
                <View pointerEvents="box-none" style={styles.new}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Keyboard.dismiss();
                      followLatest();
                      setAwayFromLatest(false);
                      scroll.current?.scrollToEnd({ animated: true });
                    }}
                  >
                    <SmoothSurface
                      color="#00000080"
                      blurIntensity={35}
                      radius={18}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={{ color: "#ffffffde" }}>最新へ</Text>
                      <View style={{ transform: [{ rotate: "90deg" }] }}>
                        <MapAsset name="chevron.right" size={12} />
                      </View>
                    </SmoothSurface>
                  </Pressable>
                </View>
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
                  color="#ffffff20"
                  blurIntensity={25}
                  radius={18}
                  style={styles.inputRow}
                >
                  <TextInput
                    onTouchStart={(event) => event.stopPropagation()}
                    placeholder="入力…"
                    placeholderTextColor="#ffffff66"
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
  history: { flex: 1, backgroundColor: "transparent", overflow: "hidden" },
  message: { paddingVertical: 8, flexDirection: "row", gap: 10 },
  author: { color: "#ffffff66", fontSize: 13, fontWeight: "600" },
  body: { color: "#ffffffb3", fontSize: 16, lineHeight: 22, fontWeight: "600" },
  more: { color: "#ffffff80", fontSize: 12, paddingVertical: 7 },
  watermark: { position: "absolute", right: 12, bottom: 10, opacity: 0.35 },
  new: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
  },
  composer: {
    backgroundColor: "#000000b3",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
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
  hint: { color: "#ffffff66", fontSize: 12 },
  send: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  arrow: { color: "white", fontSize: 32, lineHeight: 36, fontWeight: "800" },
});
