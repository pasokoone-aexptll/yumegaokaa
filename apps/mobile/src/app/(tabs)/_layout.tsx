import { Tabs } from "expo-router";
import { TabIcon } from "../../components/TabIcon";
export default function StreetTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIconStyle: { width: 60, height: 40 },
        tabBarActiveTintColor: "#008cff",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#e8edef" },
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
