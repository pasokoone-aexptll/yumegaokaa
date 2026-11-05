import { StretchySunset } from "./StretchySunset";
import { useState, type ReactNode } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Avatar } from "./Avatar";

export function AccountPage({
  children,
  name,
  avatar,
  version,
}: {
  children: ReactNode;
  name: string;
  avatar?: string;
  version?: string;
}) {
  const insets = useSafeAreaInsets();
  const [scroll] = useState(() => new Animated.Value(0));
  return (
    <SafeAreaView edges={["left", "right"]} style={s.page}>
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="never"
        removeClippedSubviews={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scroll } } }],
          { useNativeDriver: true },
        )}
      >
        <StretchySunset
          scroll={scroll}
          height={300 + insets.top}
          style={[
            s.hero,
            { minHeight: 300 + insets.top, paddingTop: insets.top + 24 },
          ]}
        >
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#00000026" }]}
          />
          <Animated.View
            style={{
              gap: 12,
              opacity: scroll.interpolate({
                inputRange: [0, 210],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
            }}
          >
            <Avatar path={avatar} version={version} name={name} size={80} />
            <Text style={s.name}>{name}</Text>
            <Animated.Text
              style={[
                s.title,
                {
                  transform: [
                    {
                      scale: scroll.interpolate({
                        inputRange: [0, 200],
                        outputRange: [1, 0.65],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            >
              アカウント
            </Animated.Text>
          </Animated.View>
        </StretchySunset>
        <View style={s.content}>{children}</View>
      </Animated.ScrollView>
      <Animated.View
        pointerEvents="none"
        style={[
          s.bar,
          {
            paddingTop: insets.top,
            height: insets.top + 44,
            opacity: scroll.interpolate({
              inputRange: [160, 220],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <Text style={s.compact}>アカウント</Text>
      </Animated.View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f2f2f7" },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f2f2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  compact: { fontSize: 17, fontWeight: "600", color: "#000000e6" },
  hero: { padding: 24, minHeight: 270, justifyContent: "flex-end" },
  name: { fontSize: 22, fontWeight: "600", color: "white" },
  title: { fontSize: 32, fontWeight: "600", color: "white" },
  content: { padding: 20, gap: 24 },
});
