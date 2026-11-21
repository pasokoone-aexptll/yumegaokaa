import { ownProfile } from "../lib/ownProfile";
import { chatRows } from "../lib/chatRows";
import { ChatMessageReveal } from "./map/ChatMessageReveal";
import { SuperAsset } from "./icons/SuperAsset";
import { mentionParts } from "../lib/chatMentions";
import { ComposerSurface } from "./ComposerSurface";
import { ChatInput } from "./ChatInput";
import { IconPressable as Pressable } from "./icons/IconMotion";
import { ArrivalIcon } from "./map/ArrivalIcon";
import { ChatTouchRegion } from "./map/ChatTouchRegion";
import { chatGeometry } from "../lib/chatGeometry";
import { useKeyboardOverlap } from "../hooks/useKeyboardOverlap";
import { ChatFade } from "./map/ChatFade";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentRef,
} from "react";
import { MapEdgeShade } from "./map/MapEdgeShade";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { ProgressiveBlur } from "./map/ProgressiveBlur";
import { MapFeedback, type MapNotice } from "./map/MapFeedback";
import { LatestChatButton } from "./map/LatestChatButton";
import { useRouter } from "expo-router";
import {
  Animated,
  Easing,
  Platform,
  Keyboard,
  Linking,
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
  const prefix = names.filter((name) => !parts.some((p) => p.name === name));
  return (
    <>
      {prefix.length > 0 && (
        <Text style={{ color: "#39A3FF" }}>
          {prefix.map((n) => "@" + n).join(" ")}{" "}
        </Text>
      )}
      {parts.map((p, i) =>
        p.name ? (
          <Text key={i} style={{ color: "#39A3FF" }}>
            {p.text}
          </Text>
        ) : (
          p.text
        ),
      )}
    </>
  );
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
  const selfProfile = useSyncExternalStore(
    ownProfile.subscribe,
    ownProfile.get,
  );
  const {
    readError,
    pending,
    pendingText,
    pendingRow,
    rowKeys,
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
  const initialLatest = useRef<string | null>(null);
  if (initialLatest.current === null && items.length)
    initialLatest.current = items[0].created_at;
  const contentLaidOut = useRef(false);
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
              title: "操作を完了できませんでした",
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
      <ProgressiveBlur
        edge="solid"
        intensity={Platform.OS === "android" ? 85 : 30}
        active={expanded}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY: translation }] },
        ]}
        pointerEvents="box-none"
      >
        {/* Extend the opaque end of the gradient beyond the translated chat,
            including the keyboard's translucent surface and rounded corners. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            height: height + insets.bottom,
            backgroundColor: "#161515",
          }}
        />
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
              height: Math.min(height * 0.45, availableHeight - overlap),
            }}
          >
            {Platform.OS !== "android" && (
              <ProgressiveBlur edge="bottom" intensity={10} />
            )}
            <MapEdgeShade edge="bottom" />
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
                        if (!readingHistory.current) {
                          jumpingToLatest.current = true;
                          scroll.current?.scrollToEnd({
                            animated: contentLaidOut.current,
                          });
                        }
                        contentLaidOut.current = true;
                      }}
                      scrollEventThrottle={32}
                      onScroll={({
                        nativeEvent: {
                          contentOffset,
                          contentSize,
                          layoutMeasurement,
                        },
                      }) => {
                        const away =
                          contentSize.height -
                            layoutMeasurement.height -
                            contentOffset.y >
                          48;
                        if (jumpingToLatest.current) return;
                        setAwayFromLatest(away);
                        if (away && expanded && !readingHistory.current)
                          beginHistory();
                        if (!away && readingHistory.current) followLatest();
                      }}
                      onScrollBeginDrag={() => {
                        jumpingToLatest.current = false;
                        beginHistory();
                      }}
                      onScrollEndDrag={({
                        nativeEvent: {
                          contentSize,
                          layoutMeasurement,
                          contentOffset,
                        },
                      }) => {
                        if (
                          contentSize.height -
                            layoutMeasurement.height -
                            contentOffset.y <=
                          48
                        )
                          followLatest();
                        endHistoryDrag();
                      }}
                      onMomentumScrollBegin={() => {
                        if (!jumpingToLatest.current) beginHistory();
                      }}
                      onMomentumScrollEnd={endHistoryDrag}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="interactive"
                      contentContainerStyle={{
                        minHeight: historyViewportHeight,
                        justifyContent: "flex-end",
                        paddingHorizontal: 17,
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
                      {chatRows(
                        items,
                        confirmedEchoes,
                        pendingRow,
                        pendingText,
                        rowKeys,
                        selfProfile,
                      ).map((m) => (
                        <ChatMessageReveal
                          key={m.rowKey}
                          waitForImage={m.kind !== "arrival" && !!m.avatar_path}
                          animate={
                            !!initialLatest.current &&
                            m.created_at > initialLatest.current
                          }
                        >
                          {(imageReady) => (
                            <Pressable
                              onLongPress={m.local ? undefined : () => menu(m)}
                              style={styles.message}
                            >
                              {m.kind === "arrival" ? (
                                <ArrivalIcon />
                              ) : (
                                <Avatar
                                  onReady={imageReady}
                                  path={m.avatar_path}
                                  version={m.avatar_updated_at}
                                  name={m.display_name}
                                  size={35}
                                  shape="square"
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
                                      <Text
                                        style={styles.authorName}
                                        accessibilityHint="タップしてメンションの宛先に追加"
                                        onPress={
                                          !m.mine && !m.deleted && m.author_id
                                            ? () =>
                                                toggleMention(
                                                  m.author_id!,
                                                  m.display_name,
                                                )
                                            : undefined
                                        }
                                      >
                                        {m.display_name}{" "}
                                        {m.stay_level
                                          ? `Lv${m.stay_level} `
                                          : ""}
                                      </Text>
                                    )}
                                    {m.sending
                                      ? busy
                                        ? "送信中"
                                        : "結果未確認"
                                      : new Date(
                                          m.created_at,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                        })}
                                  </Text>
                                  <Text
                                    textBreakStrategy="simple"
                                    android_hyphenationFrequency="none"
                                    style={styles.body}
                                  >
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
                          )}
                        </ChatMessageReveal>
                      ))}
                    </ScrollView>
                  </ChatFade>
                </ChatTouchRegion>
              </Animated.View>

              {Platform.OS === "ios" && (
                <View
                  style={{
                    position: "absolute",
                    right: 17,
                    bottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text style={{ color: "#b8b8b8", fontSize: 12 }}>Maps</Text>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Apple Maps Legal"
                    onPress={() =>
                      void Linking.openURL(
                        "https://www.apple.com/legal/internet-services/maps/",
                      )
                    }
                  >
                    <Text
                      style={{
                        color: "#b8b8b8",
                        fontSize: 11,
                        textDecorationLine: "underline",
                      }}
                    >
                      Legal
                    </Text>
                  </Pressable>
                </View>
              )}
              {(hasNew || awayFromLatest) && (
                <View pointerEvents="box-none" style={styles.new}>
                  <LatestChatButton
                    onPress={() => {
                      Keyboard.dismiss();
                      if (Platform.OS === "android") {
                        jumpingToLatest.current = true;
                        endHistoryDrag();
                      }
                      followLatest();
                      setAwayFromLatest(false);
                      scroll.current?.scrollToEnd({
                        animated: Platform.OS !== "android",
                      });
                    }}
                  />
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
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {mentions.map((m) => (
                    <Text
                      key={m.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${m.name}を宛先から外す`}
                      onPress={() => toggleMention(m.id, m.name)}
                      style={{ color: "#39A3FF" }}
                    >
                      @
                      {m.name ||
                        items.find((item) => item.author_id === m.id)
                          ?.display_name ||
                        "選択済み"}{" "}
                      ×
                    </Text>
                  ))}
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
                        <SuperAsset
                          name="chevron-base"
                          size={18}
                          tint="white"
                          opacity={0.4}
                        />
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
                      <SuperAsset
                        name="上矢印"
                        size={28}
                        tint="black"
                        opacity={0.55}
                      />
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
  message: { paddingVertical: 1.5, flexDirection: "row", gap: 9 },
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
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  inputRow: {
    flexDirection: "row",
    minHeight: 42,
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
    right: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hint: { color: "#ffffff66", fontSize: 14 },
  send: {
    width: 59,
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
