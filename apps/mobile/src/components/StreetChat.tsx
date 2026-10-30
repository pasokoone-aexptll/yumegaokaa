import { useRef, useState, type ComponentRef } from "react";
import { BlurView } from "expo-blur";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { router } from "expo-router";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useStreetChat, Message } from "../hooks/useStreetChat";
import { ui } from "./Page";
export function StreetChat() {
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
    toggleExpanded,
    beginHistory,
    loadMore,
    reload,
  } = useStreetChat();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [availableHeight, setAvailableHeight] = useState(height);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
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
      {expanded && (
        <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="チャットを閉じる"
            style={StyleSheet.absoluteFill}
            onPress={() => {
              Keyboard.dismiss();
              toggleExpanded();
            }}
          />
        </BlurView>
      )}
      <KeyboardAvoidingView
        behavior="height"
        style={{ flex: 1 }}
        pointerEvents="box-none"
      >
        <SafeAreaView
          onLayout={({ nativeEvent }) => {
            setAvailableHeight(
              Math.max(
                0,
                nativeEvent.layout.height - insets.top - insets.bottom - 8,
              ),
            );
          }}
          edges={["top", "bottom"]}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            paddingHorizontal: 18,
            paddingBottom: 8,
          }}
          pointerEvents="box-none"
        >
          <View
            style={{
              backgroundColor: expanded ? "#fff" : "#ffffffed",
              borderRadius: 24,
              padding: 12,
              height: Math.min(
                expanded ? height * 0.75 : height * 0.38,
                availableHeight,
              ),
              maxHeight: "100%",
              flexShrink: 1,
              gap: 8,
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Keyboard.dismiss();
                toggleExpanded();
              }}
            >
              <Text style={{ color: "#008cff", fontWeight: "700" }}>
                街のチャット {expanded ? "⌄ 地図へ" : "⌃ 広げる"}
              </Text>
            </Pressable>
            <ScrollView
              ref={scroll}
              maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
              onContentSizeChange={() => {
                if (!readingHistory.current)
                  scroll.current?.scrollToEnd({ animated: false });
              }}
              onScrollBeginDrag={beginHistory}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <Pressable onPress={loadMore}>
                <Text style={ui.muted}>過去の会話を読む</Text>
              </Pressable>
              {loading && <Text>読み込み中…</Text>}
              {!loading && !error && !items.length && (
                <Text style={ui.muted}>まだ会話はありません</Text>
              )}
              {[...items].reverse().map((m) => (
                <Pressable
                  key={m.id}
                  onLongPress={() => menu(m)}
                  style={{ paddingVertical: 7, flexDirection: "row", gap: 8 }}
                >
                  <Avatar
                    path={m.avatar_path}
                    version={m.avatar_updated_at}
                    name={m.display_name}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: "#80909b", fontSize: 12 }}>
                      {m.display_name} ·{" "}
                      {new Date(m.created_at).toLocaleTimeString()}
                    </Text>
                    <Text style={{ color: "#34434b" }}>
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
            {hasNew && (
              <Pressable
                onPress={() => {
                  followLatest();
                  scroll.current?.scrollToEnd({ animated: true });
                }}
              >
                <Text style={{ color: "#008cff", textAlign: "center" }}>
                  新着へ ↓
                </Text>
              </Pressable>
            )}
            {!!error && (
              <Pressable onPress={reload}>
                <Text style={ui.error}>{error}</Text>
              </Pressable>
            )}
            {chatRestrictedUntil && (
              <Text style={ui.error}>
                チャット投稿は{new Date(chatRestrictedUntil).toLocaleString()}
                まで制限されています
              </Text>
            )}
            {restoreFailed && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void restore()}
              >
                <Text style={ui.error}>送信状態を再取得</Text>
              </Pressable>
            )}
            {pending && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void revise()}
              >
                <Text style={{ color: "#008cff" }}>
                  未確定の送信を取り消して編集
                </Text>
              </Pressable>
            )}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[ui.input, { flex: 1, padding: 10 }]}
                placeholder="入力…"
                maxLength={500}
                value={text}
                onChangeText={setText}
                editable={!pending && !restoring && !restoreFailed && !busy}
              />
              <Pressable
                disabled={
                  busy ||
                  restoring ||
                  restoreFailed ||
                  !!chatRestrictedUntil ||
                  !text.trim()
                }
                onPress={() => void send()}
                style={{ padding: 10 }}
              >
                <Text style={{ color: "#008cff" }}>
                  {busy ? "確認中" : pending ? "結果を確認" : "送信"}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
