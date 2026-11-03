import { useState, useId } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { MapAsset } from "../map/MapAsset";
export function PlacementFooter({
  disabled,
  onDone,
}: {
  disabled: boolean;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const gradientId = useId().replace(/:/g, "");
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
      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}
      >
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={0}
              y2={size.height}
            >
              <Stop offset="0" stopColor="black" stopOpacity={0} />
              <Stop offset=".65" stopColor="black" stopOpacity={0.7} />
              <Stop offset="1" stopColor="black" stopOpacity={0.85} />
            </LinearGradient>
          </Defs>
          <Rect
            width={size.width}
            height={size.height}
            fill={`url(#${gradientId})`}
          />
        </Svg>
      </View>
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
