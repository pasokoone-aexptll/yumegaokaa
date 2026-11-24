import { reviewEnabled } from "../components/debug/reviewEnabled";
import { StatusBar } from "expo-status-bar";
import { requireNativeModule } from "expo-modules-core";
import { useFonts } from "expo-font";
import { LaunchSplash, SplashPlayingContext } from "../components/LaunchSplash";
import { sheetBackground } from "../components/map/mapBlur";
import { IconMotionProvider } from "../components/icons/IconMotion";
import { usePushLifecycle } from "../hooks/usePushNotifications";
import {
  AccountAccessContext,
  useAccountAccess,
} from "../hooks/useAccountAccess";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { sessionState } from "../lib/sessionState";
import { Stack, useRouter, usePathname } from "expo-router";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    OnboardingDot: require("../../assets/fonts/KH-Dot-Kodenmachou-16-Ki.ttf"),
  });
  const [splashPlaying, setSplashPlaying] = useState(true);
  const finishSplash = useCallback(() => setSplashPlaying(false), []);
  const session = useSyncExternalStore(
    sessionState.subscribe,
    sessionState.get,
  );
  const router = useRouter();
  const path = usePathname();
  const access = useAccountAccess(session.signed_in, session.revision);
  usePushLifecycle(access.status === "active", session.revision);
  const previousAccess = useRef(access.status);
  const darkNavigation =
    (path === "/" && session.signed_in) ||
    [
      "/review-map",
      "/review-chat",
      "/review-pin",
      "/map-pin",
      "/pin-confirmed",
      "/pins/create",
      "/pins/location",
      "/street-entry",
    ].includes(path);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    requireNativeModule<{ setNavigationAppearance?: (dark: boolean) => void }>(
      "PresenceNative",
    ).setNavigationAppearance?.(darkNavigation);
  }, [darkNavigation, path]);
  useEffect(() => {
    if (__DEV__ && path === "/ui-preview") return;
    // Explicit simulator review builds can show isolated fixtures without an
    // account. Real routes, auth, RPC authorization and device builds are unchanged.
    if (
      reviewEnabled &&
      [
        "/review-map",
        "/review-pin",
        "/review-chat",
        "/review-onboarding",
        "/settings/review",
      ].includes(path)
    )
      return;
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
        router.replace(wasSetup ? "/welcome" : "/");
    }
  }, [session.ready, session.signed_in, path, access.status, router]);
  if (Platform.OS === "android" && !fontsLoaded && !fontError) return null;
  return (
    <IconMotionProvider>
      <AccountAccessContext.Provider value={access}>
        <SafeAreaProvider>
          <SplashPlayingContext.Provider value={splashPlaying}>
            <Stack
              key={
                Platform.OS === "android"
                  ? session.revision
                  : `${session.revision}:${access.status}`
              }
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen
                name="(tabs)"
                options={
                  Platform.OS === "android"
                    ? { contentStyle: { backgroundColor: "#303947" } }
                    : undefined
                }
              />
              <Stack.Screen
                name="street-entry"
                options={{
                  presentation: "formSheet",
                  animation: "slide_from_bottom",
                  sheetAllowedDetents:
                    Platform.OS === "android" ? [0.5, 1] : [0.5],
                  sheetInitialDetentIndex: 0,
                  sheetGrabberVisible: true,
                  contentStyle: {
                    backgroundColor:
                      Platform.OS === "android"
                        ? sheetBackground
                        : "transparent",
                  },
                }}
              />
              <Stack.Screen
                name="map-event"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.5, 1],
                  sheetInitialDetentIndex: 0,
                  sheetGrabberVisible: true,
                  sheetExpandsWhenScrolledToEdge: true,
                  sheetLargestUndimmedDetentIndex: 1,
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
                  sheetExpandsWhenScrolledToEdge: true,
                  sheetLargestUndimmedDetentIndex: 1,
                  contentStyle: { backgroundColor: sheetBackground },
                }}
              />
              <Stack.Screen
                name="map-pin"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.47, 1],
                  sheetInitialDetentIndex: 0,
                  sheetGrabberVisible: true,
                  sheetExpandsWhenScrolledToEdge: true,
                  sheetLargestUndimmedDetentIndex: 1,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
              <Stack.Screen
                name="review-pin"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.47, 1],
                  sheetInitialDetentIndex: 0,
                  sheetGrabberVisible: true,
                  sheetExpandsWhenScrolledToEdge: true,
                  sheetLargestUndimmedDetentIndex: 1,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
              <Stack.Screen
                name="pins/create"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.47, 0.95],
                  sheetInitialDetentIndex: 0,
                  sheetGrabberVisible: true,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
              <Stack.Screen
                name="pin-confirmed"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [1],
                  sheetGrabberVisible: true,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
              <Stack.Screen
                name="pins/location"
                options={{ presentation: "fullScreenModal" }}
              />
            </Stack>
            {Platform.OS === "android" && (
              <StatusBar
                style={
                  (path === "/" && session.signed_in) ||
                  [
                    "/review-map",
                    "/review-chat",
                    "/review-pin",
                    "/map-pin",
                    "/map-event",
                    "/map-recruitment",
                    "/pin-confirmed",
                    "/pins/create",
                    "/street-entry",
                  ].includes(path)
                    ? "light"
                    : "dark"
                }
              />
            )}
            <LaunchSplash onComplete={finishSplash} />
          </SplashPlayingContext.Provider>
        </SafeAreaProvider>
      </AccountAccessContext.Provider>
    </IconMotionProvider>
  );
}
