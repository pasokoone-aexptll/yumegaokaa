import { tabInsets, tabIconStyle } from "../../components/tabInsets";
import { shouldShowTabs } from "../../lib/tabVisibility";
import { useContext, useSyncExternalStore } from "react";
import { sessionState } from "../../lib/sessionState";
import { AccountAccessContext } from "../../hooks/useAccountAccess";
import { usePinPlacement } from "../../lib/pinPlacement";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Keyboard, Platform, useWindowDimensions, View, StyleSheet } from "react-native";
import { mapBlur } from "../../components/map/mapBlur";
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
          tabBarIconStyle: tabIconStyle,
          tabBarActiveTintColor: dark ? "#fff" : "#000",
          tabBarInactiveTintColor: dark ? "#ffffff99" : "#00000099",
          tabBarBackground: Platform.OS === "android" && dark ? () => (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", backgroundColor: "#151518" }]}>
              <BlurView {...mapBlur} tint="dark" intensity={40}
                style={{ position: "absolute", inset: -16, backgroundColor: "#10101499" }} />
            </View>
          ) : undefined,
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
            backgroundColor: dark && Platform.OS === "android" ? "transparent" : dark ? "#000000e6" : "#fafafa",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: dark ? "#ffffff26" : "#0000001a",
            ...tabInsets(insets.bottom, width),
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
      {((pathname === "/pins/create" && !placement.active) || (Platform.OS === "android" && pathname === "/street-entry")) && (
        <BlurView {...mapBlur}
          pointerEvents="none"
          intensity={25}
          tint="default"
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}
