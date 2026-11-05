import { shouldShowTabs } from "../../lib/tabVisibility";
import { useContext, useSyncExternalStore } from "react";
import { sessionState } from "../../lib/sessionState";
import { AccountAccessContext } from "../../hooks/useAccountAccess";
import { usePinPlacement } from "../../lib/pinPlacement";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Keyboard, useWindowDimensions, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Tabs, usePathname } from "expo-router";
import { AnimatedTabButton } from "../../components/AnimatedTabButton";
import { TabIcon } from "../../components/TabIcon";
export default function StreetTabs() {
  const session = useSyncExternalStore(
    sessionState.subscribe,
    sessionState.get,
  );
  const access = useContext(AccountAccessContext);
  const placement = usePinPlacement();
  const pathname = usePathname();
  const dark = [
    "/",
    "/map-event",
    "/map-recruitment",
    "/pins/create",
    "/street-entry",
  ].includes(pathname);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenListeners={{ tabPress: Keyboard.dismiss }}
        screenOptions={{
          headerShown: false,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
          tabBarShowLabel: false,
          tabBarIconStyle: { width: 60, height: 40 },
          tabBarActiveTintColor: dark ? "#fff" : "#000",
          tabBarInactiveTintColor: dark ? "#ffffff99" : "#00000099",
          tabBarStyle: {
            display: shouldShowTabs(
              session.ready,
              session.signed_in,
              access.status,
              placement.active,
              access.unavailable,
            )
              ? "flex"
              : "none",
            backgroundColor: dark ? "#000000e6" : "#fafafa",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: dark ? "#ffffff26" : "#0000001a",
            height: 42 + insets.bottom,
            paddingHorizontal: width * 0.085,
            paddingTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarAccessibilityLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon kind="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Map",
            tabBarAccessibilityLabel: "Map",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon kind="map" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: "お知らせ",
            tabBarAccessibilityLabel: "お知らせ",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon kind="notification" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarAccessibilityLabel: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon kind="account" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
      {pathname === "/pins/create" && !placement.active && (
        <BlurView
          pointerEvents="none"
          intensity={25}
          tint="default"
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}
