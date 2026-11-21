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
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  return (
    <ReviewAvatars>
      <View style={{ flex: 1, backgroundColor: "#242321", paddingTop: 100 }}>
        <Pressable onPress={() => setCount((n) => n + 1)}>
          <Text style={{ color: "white", padding: 20 }}>
            新着を追加（送信なし）
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
        </ScrollView>
      </View>
    </ReviewAvatars>
  );
}
