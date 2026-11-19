import { type ReactNode, useSyncExternalStore } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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
  const session = useSyncExternalStore(
    sessionState.subscribe,
    sessionState.get,
  );
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={{ paddingBottom: insets.bottom + 25 }}
    >
      <View
        style={{
          height: 200,
          backgroundColor: "rgba(255,45,85,0.2)",
          paddingTop: insets.top,
        }}
      />
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
        <Text style={s.email}>{session.email}</Text>
      </View>
      <Text style={s.name}>@{name}</Text>
      <View style={s.content}>{children}</View>
    </ScrollView>
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
