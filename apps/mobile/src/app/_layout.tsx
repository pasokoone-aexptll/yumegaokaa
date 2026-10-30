import { useEffect, useSyncExternalStore } from "react";
import { sessionState } from "../lib/sessionState";
import { Stack, router, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function Layout() {
  const session = useSyncExternalStore(
    sessionState.subscribe,
    sessionState.get,
  );
  const path = usePathname();
  useEffect(() => {
    if (session.ready && !session.signed_in && path !== "/")
      router.replace("/");
  }, [session.ready, session.signed_in, path]);
  return (
    <SafeAreaProvider>
      <Stack key={session.revision} screenOptions={{ headerShown: false }}>
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
