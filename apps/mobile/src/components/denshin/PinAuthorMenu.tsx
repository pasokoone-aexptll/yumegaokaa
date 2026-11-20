import { Alert, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";

export type PinAuthorMenuProps = {
  onReport: () => void;
  onBlock: () => void;
};

export function PinAuthorMenu({ onReport, onBlock }: PinAuthorMenuProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="PINのその他の操作"
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
      }}
      onPress={() =>
        Alert.alert("投稿者の操作", undefined, [
          { text: "通報", onPress: onReport },
          { text: "ブロック", style: "destructive", onPress: onBlock },
          { text: "戻る", style: "cancel" },
        ])
      }
    >
      <Svg width={26} height={10} viewBox="0 0 26 10">
        {[3, 13, 23].map((cx) => (
          <Circle key={cx} cx={cx} cy={5} r={2.5} fill="white" opacity={0.7} />
        ))}
      </Svg>
    </Pressable>
  );
}
