import { LaunchSplash } from "../components/LaunchSplash";
import { sheetBackground } from "../components/map/mapBlur";
import { IconMotionProvider } from "../components/icons/IconMotion";
import { usePushLifecycle } from "../hooks/usePushNotifications";
import {
  AccountAccessContext,
  useAccountAccess,
} from "../hooks/useAccountAccess";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { sessionState } from "../lib/sessionState";
import { Stack, useRouter, usePathname } from "expo-router";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function Layout() {
  const session = useSyncExternalStore(
    sessionState.subscribe,
    sessionState.get,
  );
  const router = useRouter();
  const path = usePathname();
  const access = useAccountAccess(session.signed_in, session.revision);
  usePushLifecycle(access.status === "active", session.revision);
  const previousAccess = useRef(access.status);
  useEffect(() => {
    if (__DEV__ && path === "/ui-preview") return;
    const wasSetup = ["profile_required", "pool_required"].includes(
      previousAccess.current,
    );
    previousAccess.current = access.status;
    if (session.ready && !session.signed_in && path !== "/")
      router.replace("/");
    else if (session.signed_in) {
      if (
        ["suspended", "withdrawn", "expired"].includes(access.status) &&
        path !== "/access"
      )
        router.replace("/access");
      else if (access.status === "unregistered" && path !== "/invitations")
        router.replace("/invitations");
      else if (access.status === "pool_required" && path !== "/street-icons")
        router.replace("/street-icons");
      else if (access.status === "profile_required" && path !== "/profile")
        router.replace("/profile");
      else if (
        access.status === "active" &&
        (path === "/access" ||
          (wasSetup && ["/profile", "/street-icons"].includes(path)))
      )
        router.replace("/");
    }
  }, [session.ready, session.signed_in, path, access.status, router]);
  return (
    <IconMotionProvider>
      <AccountAccessContext.Provider value={access}>
        <SafeAreaProvider>
          <Stack
            key={Platform.OS === "android" ? session.revision : `${session.revision}:${access.status}`}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="(tabs)" options={Platform.OS === "android" ? { contentStyle: { backgroundColor: "#303947" } } : undefined} />
            <Stack.Screen
              name="street-entry"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.57],
                sheetInitialDetentIndex: 0,
                sheetGrabberVisible: true,
                sheetCornerRadius: Platform.OS === "android" ? 28 : undefined,
                contentStyle: { backgroundColor: Platform.OS === "android" ? sheetBackground : "transparent" },
              }}
            />
            <Stack.Screen
              name="map-event"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.5, 1],
                sheetInitialDetentIndex: 0,
                sheetGrabberVisible: true,
                sheetCornerRadius: Platform.OS === "android" ? 28 : undefined,
                sheetExpandsWhenScrolledToEdge: true,
                sheetLargestUndimmedDetentIndex: 0,
                contentStyle: { backgroundColor: sheetBackground },
              }}
            />
            <Stack.Screen
              name="map-recruitment"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.5, 1],
                sheetInitialDetentIndex: 0,
                sheetGrabberVisible: true,
                sheetCornerRadius: Platform.OS === "android" ? 28 : undefined,
                sheetExpandsWhenScrolledToEdge: true,
                sheetLargestUndimmedDetentIndex: 0,
                contentStyle: { backgroundColor: sheetBackground },
              }}
            />
            <Stack.Screen
              name="pins/create"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.57, 0.85],
                sheetInitialDetentIndex: 0,
                sheetGrabberVisible: true,
                sheetCornerRadius: Platform.OS === "android" ? 28 : undefined,
                contentStyle: { backgroundColor: "white" },
              }}
            />
            <Stack.Screen
              name="pins/location"
              options={{ presentation: "fullScreenModal" }}
            />
          </Stack>
          <LaunchSplash />
        </SafeAreaProvider>
      </AccountAccessContext.Provider>
    </IconMotionProvider>
  );
}
