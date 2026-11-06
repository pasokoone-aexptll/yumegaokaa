import { mentionParts } from "../lib/chatMentions";
import { ComposerSurface } from "./ComposerSurface";
import { ChatInput } from "./ChatInput";
import { IconPressable as Pressable } from "./icons/IconMotion";
import { ArrivalIcon } from "./map/ArrivalIcon";
import { ChatTouchRegion } from "./map/ChatTouchRegion";
import { chatGeometry } from "../lib/chatGeometry";
import { useKeyboardOverlap } from "../hooks/useKeyboardOverlap";
import { ChatFade } from "./map/ChatFade";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { ProgressiveBlur } from "./map/ProgressiveBlur";
import { MapAsset } from "./map/MapAsset";
import { MapFeedback, type MapNotice } from "./map/MapFeedback";
import { SmoothSurface } from "./map/SmoothSurface";
import { useRouter } from "expo-router";
import {
  Animated,
  Easing,
  Platform,
  Keyboard,
  Alert,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useStreetChat, type Message } from "../hooks/useStreetChat";

function MentionBody({ message }: { message: Message }) {
  const names = message.mentions ?? [];
  const parts = mentionParts(message.body ?? "", names);
  const prefix = names.filter(name => !parts.some(p => p.name === name));
  return <>{prefix.length > 0 && <Text style={{ color: "#39A3FF" }}>{prefix.map(n => "@"+n).join(" ")} </Text>}
    {parts.map((p,i) => p.name ? <Text key={i} style={{ color: "#39A3FF" }}>{p.text}</Text> : p.text)}</>;
}

export function StreetChat({
  mapError = "",
  mapMoving = false,
  onReadStatus,
  onHistoryChange,
}: {
  onHistoryChange?: (expanded: boolean) => void;
  mapError?: string;
  mapMoving?: boolean;
  onReadStatus?: (status: {
    error: string;
    reload: () => Promise<void>;
  }) => void;
}) {
  const router = useRouter();
  const {
    readError,
    pending,
    pendingText,
    confirmedEchoes,
    mentions,
    toggleMention,
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
  useEffect(() => {
    onHistoryChange?.(expanded);
    return () => onHistoryChange?.(false);
  }, [expanded, onHistoryChange]);
  useEffect(() => {
    onReadStatus?.({ error: readError, reload });
  }, [readError, reload, onReadStatus]);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { root, overlap, measure, translation } = useKeyboardOverlap(
    insets.bottom + 42,
  );
  const [availableHeight, setAvailableHeight] = useState(height);
  const [footerHeight, setFooterHeight] = useState(66);
  const geometry = chatGeometry(height, availableHeight, footerHeight, overlap);
  const collapsedHeight = geometry.collapsed;
  const expandedHeight = geometry.expanded;
  const historyViewportHeight = geometry.viewport;
  const historyTopPadding = geometry.topPadding;
  const [composing, setComposing] = useState(false);
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
  const [mapOpacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const animation = Animated.timing(mapOpacity, {
      toValue: mapMoving ? 0.25 : 1,
      duration: mapMoving ? 140 : 240,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [mapMoving, mapOpacity]);
  // Android also reports momentum for an animated scrollToEnd. Only a new
  // finger drag should reopen history after the user chooses the latest post.
  const jumpingToLatest = useRef(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const latestId = items[0]?.id;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!readingHistory.current) scroll.current?.scrollToEnd({ animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [latestId, readingHistory]);
  const notice: MapNotice | null = busy
    ? null
    : restoreFailed
      ? {
          title: "送信状態を確認できません",
          message: "前回の送信を確認してから再開してください。",
          actions: [{ title: "再取得", onPress: () => void restore() }],
        }
      : pending
        ? {
            title: "送信結果が未確認です",
            message: "送信結果を確認できません。",
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
            : mapError
              ? { title: "通信・参加状態", message: mapError }
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
    <View
      ref={root}
      collapsable={false}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={({ nativeEvent }) => {
        setAvailableHeight(Math.max(0, nativeEvent.layout.height - insets.top));
        measure();
      }}
    >
      <ProgressiveBlur edge="solid" intensity={Platform.OS === "android" ? 85 : 30} active={expanded} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY: translation }] },
        ]}
        pointerEvents="box-none"
      >
        <SafeAreaView
          edges={["top"]}
          pointerEvents="box-none"
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: Math.min(height * 0.55, availableHeight - overlap),
            }}
          >
            {Platform.OS !== "android" && <ProgressiveBlur edge="bottom" intensity={24} />}
            {Platform.OS === "android" ? (
              <View style={[StyleSheet.absoluteFill, {
                experimental_backgroundImage: "linear-gradient(180deg, rgba(23,27,35,0) 0%, rgba(23,27,35,0.32) 50%, rgba(23,27,35,0.82) 100%)",
              }]} />
            ) : <Svg
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              width="100%"
              height="100%"
            >
              <Defs>
                <LinearGradient id="chatShade" x1="0" y1="0" x2="0" y2="100%">
                  <Stop offset="0" stopColor="black" stopOpacity={0} />
                  <Stop offset="1" stopColor="black" stopOpacity={0.46} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#chatShade)" />
            </Svg>}
          </View>
          <Animated.View
            pointerEvents="box-none"
            style={{
              height: expansion.interpolate({
                inputRange: [0, 1],
                outputRange: [collapsedHeight, expandedHeight],
              }),
              maxHeight: "100%",
              flexShrink: 1,
            }}
          >
            <View
              pointerEvents="box-none"
              style={styles.history}
              onTouchStart={Keyboard.dismiss}
            >
              <View pointerEvents="none" style={styles.watermark}>
                <MapAsset name="DreamCloud Logo" width={147} height={22} />
              </View>
              <Animated.View
                pointerEvents="box-none"
                style={[StyleSheet.absoluteFill, { opacity: mapOpacity }]}
              >
                <ChatTouchRegion surface style={StyleSheet.absoluteFill}>
                  <ChatFade
                    fadeTop={expansion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        historyViewportHeight -
                          Math.max(0, collapsedHeight - footerHeight),
                        historyViewportHeight -
                          Math.max(0, expandedHeight - footerHeight),
                      ],
                    })}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: historyViewportHeight,
                    }}
                  >
                    <ScrollView
                      ref={scroll}
                      // Keep the native scroll viewport fixed while the parent reveals it.
                      // Resizing its top edge during a drag moves the touched row away from the finger.
                      style={{ flex: 1 }}
                      automaticallyAdjustKeyboardInsets={false}
                      automaticallyAdjustContentInsets={false}
                      contentInsetAdjustmentBehavior="never"
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
                        const away = contentSize.height - layoutMeasurement.height - contentOffset.y > 48;
                        if (jumpingToLatest.current) return;
                        setAwayFromLatest(away);
                        if (away && expanded && !readingHistory.current) beginHistory();
                        if (!away && readingHistory.current) followLatest();
                      }}
                      onScrollBeginDrag={() => {
                        jumpingToLatest.current = false;
                        beginHistory();
                      }}
                      onScrollEndDrag={({ nativeEvent: { contentSize, layoutMeasurement, contentOffset } }) => {
                        if (contentSize.height - layoutMeasurement.height - contentOffset.y <= 48) followLatest();
                        endHistoryDrag();
                      }}
                      onMomentumScrollBegin={() => { if (!jumpingToLatest.current) beginHistory(); }}
                      onMomentumScrollEnd={endHistoryDrag}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="interactive"
                      contentContainerStyle={{
                        minHeight: historyViewportHeight,
                        justifyContent: "flex-end",
                        paddingHorizontal: 12,
                        paddingTop: historyTopPadding,
                        paddingBottom: 4,
                      }}
                    >
                      <Pressable onPress={loadMore} accessibilityRole="button">
                        <ChatTouchRegion style={{ alignSelf: "flex-start" }}>
                          <Text style={styles.more}>過去の会話を読む</Text>
                        </ChatTouchRegion>
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
                          {m.kind === "arrival" ? (
                            <ArrivalIcon />
                          ) : (
                            <Avatar
                              path={m.avatar_path}
                              version={m.avatar_updated_at}
                              name={m.display_name}
                              size={32}
                            />
                          )}
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <ChatTouchRegion
                              style={{
                                alignSelf: "flex-start",
                                maxWidth: "100%",
                              }}
                            >
                              <Text style={styles.author}>
                                {m.kind !== "arrival" && (
                                  <Text style={styles.authorName}
                                    accessibilityHint="タップしてメンションの宛先に追加"
                                    onPress={!m.mine && !m.deleted && m.author_id ? () => toggleMention(m.author_id!, m.display_name) : undefined}>
                                    {m.display_name}{" "}
                                    {m.stay_level ? `Lv${m.stay_level} ` : ""}
                                  </Text>
                                )}
                                {new Date(m.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </Text>
                              <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={styles.body}>
                                {m.deleted ? (
                                  "削除されたメッセージ"
                                ) : m.kind === "arrival" ? (
                                  <>
                                    <Text
                                      style={[
                                        styles.authorName,
                                        { color: "#ffffffb3" },
                                      ]}
                                    >
                                      {m.display_name}
                                    </Text>{" "}
                                    が街に参加しました
                                  </>
                                ) : (
                                  <MentionBody message={m} />
                                )}
                              </Text>
                            </ChatTouchRegion>
                          </View>
                        </Pressable>
                      ))}
                      {confirmedEchoes
                        .filter((e) => !items.some((m) => m.id === e.id))
                        .map((e) => (
                          <View
                            key={`confirmed-${e.id}`}
                            style={styles.message}
                          >
                            <View style={{ width: 32 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.author}>自分</Text>
                              <ChatTouchRegion
                                style={{
                                  alignSelf: "flex-start",
                                  maxWidth: "100%",
                                }}
                              >
                                <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={styles.body}>{e.body}</Text>
                              </ChatTouchRegion>
                            </View>
                          </View>
                        ))}
                      {pendingText !== null && (
                        <View
                          style={[styles.message, { opacity: 0.45 }]}
                          accessibilityLabel={`${busy ? "送信中" : "結果未確認"}：${pendingText}`}
                        >
                          <View
                            style={{
                              width: 32,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {busy && (
                              <ActivityIndicator size="small" color="white" />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.author}>
                              自分 · {busy ? "送信中" : "結果未確認"}
                            </Text>
                            <ChatTouchRegion
                              style={{
                                alignSelf: "flex-start",
                                maxWidth: "100%",
                              }}
                            >
                              <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={styles.body}>{pendingText}</Text>
                            </ChatTouchRegion>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </ChatFade>
                </ChatTouchRegion>
              </Animated.View>

              {(hasNew || awayFromLatest) && (
                <View pointerEvents="box-none" style={styles.new}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Keyboard.dismiss();
                      if (Platform.OS === "android") {
                        jumpingToLatest.current = true;
                        endHistoryDrag();
                      }
                      followLatest();
                      setAwayFromLatest(false);
                      scroll.current?.scrollToEnd({ animated: Platform.OS !== "android" });
                    }}
                  >
                    <SmoothSurface
                      color="#ffffff01"
                      blurIntensity={35}
                      radius={26}
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
              {mentions.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {mentions.map(m => <Text key={m.id} accessibilityRole="button"
                    accessibilityLabel={`${m.name}を宛先から外す`}
                    onPress={() => toggleMention(m.id, m.name)} style={{ color: "#39A3FF" }}>
                    @{m.name || items.find(item => item.author_id === m.id)?.display_name || "選択済み"} ×
                  </Text>)}
                </View>
              )}
              <View style={styles.composer} onTouchStart={Keyboard.dismiss}>
                <ComposerSurface
                  color="#ffffff26"
                  blurIntensity={0}
                  backdrop={<ProgressiveBlur edge="solid" intensity={85} />}
                  radius={16}
                  style={styles.inputRow}
                >
                  <ChatInput
                    onCompositionChange={setComposing}
                    onTouchStart={(event) => event.stopPropagation()}
                    placeholder="入力…"
                    placeholderTextColor="#ffffff66"
                    maxLength={500}
                    value={pending ? "" : text}
                    onChangeText={setText}
                    accessibilityLabel="街のチャットに入力"
                    style={styles.input}
                    editable={!pending && !restoring && !restoreFailed && !busy}
                  />
                  {!text && (
                    <View pointerEvents="none" style={styles.inputHint}>
                      <Text style={styles.hint}>街ローカルチャット</Text>
                      <View style={{ opacity: 0.47 }}>
                        <MapAsset name="chevron.right" size={12} />
                      </View>
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={pending ? "送信結果を確認" : "送信"}
                    disabled={
                      composing ||
                      busy ||
                      restoring ||
                      restoreFailed ||
                      !!chatRestrictedUntil ||
                      !text.trim()
                    }
                    onPress={() => {
                      followLatest();
                      setAwayFromLatest(false);
                      void send();
                    }}
                    style={styles.send}
                  >
                    {busy || restoring ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.arrow}>↑</Text>
                    )}
                  </Pressable>
                </ComposerSurface>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  history: { flex: 1, backgroundColor: "transparent", overflow: "hidden" },
  message: { paddingVertical: 7, flexDirection: "row", gap: 8 },
  author: {
    color: "#ffffff61",
    fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500",
  },
  authorName: {
    fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
    color: "#ffffff4d",
    fontWeight: "600",
  },
  body: {
    color: "#ffffff99",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    marginTop: 2,
  },
  more: { color: "#ffffff80", fontSize: 12, paddingVertical: 7 },
  watermark: {
    position: "absolute",
    right: 12,
    bottom: 10,
  },
  new: {
    zIndex: 2,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
  },
  composer: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: "row",
    minHeight: 46,
    alignItems: "center",
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: "#ffffff99",
    paddingLeft: 15,
    paddingVertical: 11,
    fontSize: 18,
  },
  inputHint: {
    position: "absolute",
    right: 73,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hint: { color: "#ffffff66", fontSize: 14 },
  send: {
    width: 63,
    backgroundColor: "#ffffff26",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  arrow: {
    color: "#00000099",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "600",
  },
});
