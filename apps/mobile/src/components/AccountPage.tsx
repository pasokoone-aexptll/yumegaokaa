import { type ReactNode, useSyncExternalStore, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountHeaderBackground } from "./AccountHeaderBackground";
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
              transform: [
                { translateY: Animated.multiply(pull, -0.5) },
                { scaleY: Animated.add(1, Animated.divide(pull, 200)) },
              ],
            },
          ]}
        >
          <AccountHeaderBackground />
        </Animated.View>
      </View>
      <View style={s.identity}>
        <View style={s.avatar}>
          <Avatar
            path={avatar}
            version={version}
            name={name}
            size={96}
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
    marginTop: -53,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 21,
    gap: 8,
  },
  avatar: { borderRadius: 26, padding: 5, backgroundColor: "#F6F6F6" },
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
    marginTop: 9,
    marginBottom: 32,
  },
  content: { paddingHorizontal: 26, gap: 26 },
});
