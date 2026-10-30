import { Tabs } from "expo-router";
import { Text } from "react-native";
export default function StreetTabs() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#008cff", tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#e8edef" } }}>
    <Tabs.Screen name="home" options={{ title: "Home", tabBarAccessibilityLabel: "Home", tabBarIcon: ({color}) => <Text style={{fontSize: 27,color}}>⌂</Text> }} />
    <Tabs.Screen name="index" options={{ title: "Map", tabBarAccessibilityLabel: "Map", tabBarIcon: ({color}) => <Text style={{fontSize: 25,color}}>◎</Text> }} />
    <Tabs.Screen name="settings" options={{ title: "Settings", tabBarAccessibilityLabel: "Settings", tabBarIcon: ({color}) => <Text style={{fontSize: 25,color}}>♙</Text> }} />
  </Tabs>;
}
