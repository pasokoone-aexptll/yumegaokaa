import type { ReactNode } from "react";
import { Alert, Pressable } from "react-native";

export type PinAuthorMenuProps = {
  children: ReactNode;
  onReport: () => void;
  onBlock: () => void;
};

export function PinAuthorMenu({
  children,
  onReport,
  onBlock,
}: PinAuthorMenuProps) {
  return (
    <Pressable
      accessibilityLabel="投稿者の操作"
      accessibilityHint="長押しで通報とブロックを表示"
      onLongPress={() =>
        Alert.alert("投稿者の操作", undefined, [
          { text: "通報", onPress: onReport },
          { text: "ブロック", style: "destructive", onPress: onBlock },
          { text: "戻る", style: "cancel" },
        ])
      }
    >
      {children}
    </Pressable>
  );
}
