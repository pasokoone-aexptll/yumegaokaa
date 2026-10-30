import { router } from "expo-router";
import {
  Alert,
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
      ...(!m.mine
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
      style={{
        backgroundColor: expanded ? "#fff" : "#ffffffed",
        borderRadius: 24,
        padding: 12,
        height: expanded ? 460 : 260,
        gap: 8,
      }}
    >
      <Pressable onPress={toggleExpanded}>
        <Text style={{ color: "#008cff", fontWeight: "700" }}>
          街のチャット {expanded ? "⌄ 地図へ" : "⌃ 広げる"}
        </Text>
      </Pressable>
      <ScrollView
        onScrollBeginDrag={beginHistory}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={loadMore}>
          <Text style={ui.muted}>過去の会話を読む</Text>
        </Pressable>
        {loading && <Text>読み込み中…</Text>}
        {!loading && !error && !items.length && (
          <Text style={ui.muted}>
            まだ会話はありません。話さず眺めていても大丈夫。
          </Text>
        )}
        {[...items].reverse().map((m) => (
          <Pressable
            key={m.id}
            onLongPress={() => menu(m)}
            style={{ paddingVertical: 7 }}
          >
            <Text style={{ color: "#80909b", fontSize: 12 }}>
              {m.display_name} · {new Date(m.created_at).toLocaleTimeString()}
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
      {!!error && (
        <Pressable onPress={reload}>
          <Text style={ui.error}>{error}</Text>
        </Pressable>
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
          disabled={busy || !text.trim()}
          onPress={() => void send()}
          style={{ padding: 10 }}
        >
          <Text style={{ color: "#008cff" }}>{busy ? "送信中" : "送信"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
