import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapAsset } from "../map/MapAsset";
export function PlacementFooter({
  disabled,
  onDone,
}: {
  disabled: boolean;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 290 + insets.bottom,
        justifyContent: "flex-end",
      }}
    >
      <Image
        pointerEvents="none"
        source={require("../../../assets/figma-map/placement-shade.png")}
        resizeMode="stretch"
        style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
      />
      <View
        pointerEvents="none"
        style={{
          alignSelf: "flex-end",
          marginRight: 20,
          marginBottom: 22,
          opacity: 0.4,
        }}
      >
        <MapAsset name="DreamCloud Logo" width={147} height={22} />
      </View>
      <View
        style={{
          paddingHorizontal: 26,
          paddingBottom: Math.max(insets.bottom, 18),
          gap: 12,
        }}
      >
        <Text style={{ color: "#ffffff88", fontWeight: "600", fontSize: 18 }}>
          ピンの場所を選択中...
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDone}
          style={{
            backgroundColor: "#ffffffcc",
            opacity: disabled ? 0.45 : 1,
            borderRadius: 28,
            borderCurve: "continuous",
            height: 54,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "black" }}>
            完了
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
