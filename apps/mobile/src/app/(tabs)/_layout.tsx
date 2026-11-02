import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Keyboard, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { TabIcon } from "../../components/TabIcon";
export default function StreetTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <Tabs
      screenListeners={{ tabPress: Keyboard.dismiss }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIconStyle: { width: 60, height: 40 },
        tabBarActiveTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#000000e6",
          borderTopWidth: 0,
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
  );
}
