import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { ProgressiveBlur } from "../map/ProgressiveBlur";
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
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ProgressiveBlur edge="bottom" intensity={40} />
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient
              id="placementShade"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset="0" stopColor="black" stopOpacity={0} />
              <Stop offset=".65" stopColor="black" stopOpacity={0.7} />
              <Stop offset="1" stopColor="black" stopOpacity={0.85} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#placementShade)" />
        </Svg>
      </View>
      <Image
        pointerEvents="none"
        source={require("../../../assets/figma-map/logo for darkmodeMap.png")}
        resizeMode="contain"
        style={{
          width: 160,
          height: 32,
          alignSelf: "flex-end",
          marginRight: 20,
          marginBottom: 22,
          opacity: 0.4,
        }}
      />
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
