import { chatRows } from "../lib/chatRows";
import type { Message } from "../hooks/useStreetChat";
import { useEffect } from "react";
import { useRef, useState, type ComponentRef } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Avatar } from "../components/Avatar";
import { ReviewAvatars } from "../components/debug/ReviewAvatars";
import { reviewEnabled } from "../components/debug/reviewEnabled";
import { ChatMessageReveal } from "../components/map/ChatMessageReveal";

export default function ReviewChat() {
  return reviewEnabled ? <Scene /> : null;
}
function Scene() {
  const [count, setCount] = useState(5);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!phase || phase === 3) return;
    const timer = setTimeout(() => setPhase((p) => p + 1), 1500);
    return () => clearTimeout(timer);
  }, [phase]);
  const local = { key: "self-review", created_at: "2026-11-21T00:00:00Z" };
  const profile = { display_name: "nyan_x" };
  const server: Message = {
    id: "server-review",
    body: "自分の投稿：確定しても同じ行",
    created_at: local.created_at,
    display_name: "nyan_x",
    author_id: "self",
    mine: true,
    kind: "text",
    deleted: false,
  };
  const ownRows = chatRows(
    phase === 3 ? [server] : [],
    phase === 2 ? [{ id: server.id, body: server.body!, ...local }] : [],
    phase === 1 ? local : null,
    phase === 1 ? server.body : null,
    { [server.id]: local.key },
    profile,
  );

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  return (
    <ReviewAvatars>
      <View style={{ flex: 1, backgroundColor: "#242321", paddingTop: 100 }}>
        <Pressable onPress={() => setCount((n) => n + 1)}>
          <Text style={{ color: "white", padding: 20 }}>
            新着を追加（送信なし）
          </Text>
        </Pressable>
        <Pressable onPress={() => setPhase(1)}>
          <Text style={{ color: "white", padding: 20 }}>
            自分の送信を再現（通信なし） {phase}
          </Text>
        </Pressable>
        <ScrollView
          ref={scroll}
          style={{ height: 260, flexGrow: 0 }}
          onContentSizeChange={() =>
            scroll.current?.scrollToEnd({ animated: count > 5 })
          }
        >
          {Array.from({ length: count }, (_, i) => (
            <ChatMessageReveal key={i} waitForImage animate={i >= 5}>
              {(ready) => (
                <View style={{ flexDirection: "row", gap: 12, padding: 12 }}>
                  <Avatar
                    name="nyan_x"
                    size={35}
                    shape="square"
                    onReady={ready}
                  />
                  <Text style={{ color: "white", fontSize: 18 }}>
                    確認用の新着 {i + 1}
                  </Text>
                </View>
              )}
            </ChatMessageReveal>
          ))}
          {ownRows.map((row) => (
            <ChatMessageReveal key={row.rowKey} waitForImage animate>
              {(ready) => (
                <View style={{ flexDirection: "row", gap: 12, padding: 12 }}>
                  <Avatar
                    name={row.display_name}
                    size={35}
                    shape="square"
                    onReady={ready}
                  />
                  <Text style={{ color: "white", fontSize: 18 }}>
                    {row.body}
                  </Text>
                </View>
              )}
            </ChatMessageReveal>
          ))}
        </ScrollView>
      </View>
    </ReviewAvatars>
  );
}
