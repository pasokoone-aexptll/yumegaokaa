import { type ReactNode, useSyncExternalStore, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { sessionState } from "../lib/sessionState";
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
  const pull = scroll.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1, 0, 0],
    extrapolateRight: "clamp",
  });
  const session = useSyncExternalStore(
    sessionState.subscribe,
    sessionState.get,
  );
  return (
    <Animated.ScrollView
      style={s.page}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scroll } } }],
        { useNativeDriver: true },
      )}
      contentContainerStyle={{ paddingBottom: insets.bottom + 25 }}
    >
      <View style={{ height: 200 }}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(255,45,85,0.2)",
              transform: [
                { translateY: Animated.multiply(pull, -0.5) },
                { scaleY: Animated.add(1, Animated.divide(pull, 200)) },
              ],
            },
          ]}
        />
      </View>
      <View style={s.identity}>
        <View style={s.avatar}>
          <Avatar
            path={avatar}
            version={version}
            name={name}
            size={100}
            shape="square"
          />
        </View>
        <Text numberOfLines={1} style={s.email}>
          {session.email}
        </Text>
      </View>
      <Text style={s.name}>@{name}</Text>
      <View style={s.content}>{children}</View>
    </Animated.ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F6F6" },
  identity: {
    marginTop: -52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  avatar: { borderRadius: 26, padding: 4, backgroundColor: "#F6F6F6" },
  email: {
    flex: 1,
    fontFamily: "ui-rounded",
    color: "rgba(0,0,0,0.18)",
    fontSize: 14,
    alignSelf: "flex-start",
    marginTop: 29,
  },
  name: {
    fontFamily: "ui-rounded",
    fontWeight: "800",
    fontSize: 28,
    marginHorizontal: 30,
    marginTop: 12,
    marginBottom: 32,
  },
  content: { paddingHorizontal: 26, gap: 26 },
});
