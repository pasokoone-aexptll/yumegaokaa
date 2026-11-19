import { ReducedIconMotion } from "../../components/icons/IconMotion";
import { tabInsets, tabIconStyle } from "../../components/tabInsets";
import { shouldShowTabs } from "../../lib/tabVisibility";
import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { sessionState } from "../../lib/sessionState";
import { AccountAccessContext } from "../../hooks/useAccountAccess";
import { usePinPlacement } from "../../lib/pinPlacement";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  useWindowDimensions,
  View,
  StyleSheet,
} from "react-native";
import { MapBlurView } from "../../components/map/MapBlurView";
import { Tabs, usePathname } from "expo-router";
import { AnimatedTabButton } from "../../components/AnimatedTabButton";
import { TabIcon } from "../../components/TabIcon";
export default function StreetTabs() {
  const reducedMotion = useContext(ReducedIconMotion);
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
    "/map-pin",
    "/review-pin",
    "/pin-confirmed",
    "/map-recruitment",
    "/pins/create",
    "/street-entry",
  ].includes(pathname);
  const [themeProgress] = useState(() => new Animated.Value(dark ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(themeProgress, {
      toValue: dark ? 1 : 0,
      duration: reducedMotion ? 0 : 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [dark, reducedMotion, themeProgress]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenListeners={{ tabPress: Keyboard.dismiss }}
        screenOptions={{
          headerShown: false,
          lazy: false,
          sceneStyle: { backgroundColor: "white" },
          animation: reducedMotion ? "none" : "shift",
          transitionSpec: {
            animation: "timing",
            config: {
              duration: reducedMotion ? 0 : 320,
              easing: Easing.inOut(Easing.cubic),
            },
          },
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              opacity: 1,
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-width, 0, width],
                  }),
                },
              ],
            },
          }),
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
          tabBarShowLabel: false,
          tabBarIconStyle: tabIconStyle,
          tabBarActiveTintColor: dark ? "#fff" : "#000",
          tabBarInactiveTintColor: dark ? "#ffffff99" : "#00000099",
          tabBarBackground:
            Platform.OS === "android" && dark
              ? () => (
                  <View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      { overflow: "hidden", backgroundColor: "#151518" },
                    ]}
                  >
                    <MapBlurView
                      tint="dark"
                      intensity={40}
                      style={{ position: "absolute", inset: -16 }}
                    />
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: "#18181be6" },
                      ]}
                    />
                  </View>
                )
              : () => (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: themeProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["rgb(250,250,250)", "rgb(26,26,26)"],
                        }),
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: themeProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            "rgba(0,0,0,0.1)",
                            "rgba(255,255,255,0.15)",
                          ],
                        }),
                      },
                    ]}
                  />
                ),
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
            backgroundColor: "transparent",
            borderTopWidth: 0,
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
      {Platform.OS === "android" &&
        ((pathname === "/pins/create" && !placement.active) ||
          pathname === "/street-entry") && (
          <MapBlurView
            pointerEvents="none"
            intensity={25}
            tint="default"
            style={StyleSheet.absoluteFill}
          />
        )}
    </View>
  );
}
