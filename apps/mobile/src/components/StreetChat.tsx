import { useRef, type ComponentRef } from "react";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
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
        behavior="padding"
        style={{ flex: 1 }}
        pointerEvents="box-none"
      >
        <SafeAreaView
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
              height: expanded ? height * 0.75 : height * 0.38,
              maxHeight: "100%",
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
                  style={{ paddingVertical: 7 }}
                >
                  <Avatar
                    path={m.avatar_path}
                    version={m.avatar_updated_at}
                    name={m.display_name}
                  />
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
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[ui.input, { flex: 1, padding: 10 }]}
                placeholder="入力…"
                maxLength={500}
                value={text}
                onChangeText={setText}
              />
              <Pressable
                disabled={busy || !!chatRestrictedUntil || !text.trim()}
                onPress={() => void send()}
                style={{ padding: 10 }}
              >
                <Text style={{ color: "#008cff" }}>
                  {busy ? "送信中" : "送信"}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
