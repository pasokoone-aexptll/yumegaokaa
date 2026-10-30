import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pins/create" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="pins/location"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
