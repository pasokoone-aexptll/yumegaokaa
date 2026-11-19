import { useContext, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import assets from "./icons/superassets.json";
import { SvgXml } from "react-native-svg";
import { SuperAsset } from "./icons/SuperAsset";
import { ReducedIconMotion } from "./icons/IconMotion";

// Reuse the supplied running figure, including its original silhouette.
const figure = assets["非常口の人物"].replace(/fill="#[^"]*"/g, 'fill="white"');
export function LaunchSplash() {
  const reduced = useContext(ReducedIconMotion);
  const { width, height } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const motion = Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 200 : 1850,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    motion.start(({ finished: done }) => {
      if (done) setFinished(true);
    });
    return () => motion.stop();
  }, [progress, reduced]);
  if (finished) return null;
  const doorWidth = width * 0.244;
  const doorHeight = doorWidth * 1.49;
  const zoom = Math.max(width / doorWidth, height / doorHeight) * 1.15;
  const opacity = progress.interpolate({
    inputRange: [0, 0.82, 1],
    outputRange: [1, 1, 0],
  });
  const scale = reduced
    ? 1
    : progress.interpolate({
        inputRange: [0, 0.51, 0.76, 1],
        outputRange: [1, 1, zoom, zoom],
      });
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.cover, { opacity }]}
    >
      <Animated.View
        style={{ width: doorWidth, height: doorHeight, transform: [{ scale }] }}
      >
        <Animated.View
          style={{
            position: "absolute",
            width: doorWidth,
            height: doorHeight,
            transform: [
              {
                scaleX: reduced
                  ? 1
                  : progress.interpolate({
                      inputRange: [0, 0.16, 1],
                      outputRange: [0.01, 1, 1],
                    }),
              },
            ],
          }}
        >
          <Svg
            width={doorWidth * 2.8}
            height={doorHeight * 2.2}
            viewBox="0 0 280 328"
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <Defs>
              <LinearGradient
                id="floor"
                x1="50"
                y1="149"
                x2="205"
                y2="304"
                gradientUnits="userSpaceOnUse"
              >
                <Stop stopColor="#00AF6B" stopOpacity={0.65} />
                <Stop offset="1" stopColor="#00AF6B" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width="100" height="149" fill="#00AF6B" />
            <Path d="M0 149H100L255 304H155Z" fill="url(#floor)" />
          </Svg>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: doorHeight,
              width: doorWidth * 2.8,
              height: doorHeight,
            }}
          >
            <SvgXml
              width={doorWidth * 2.8}
              height={doorHeight}
              xml={`<svg viewBox="0 0 280 149" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="shadowFade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity="0.6"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="shadowMask"><rect width="280" height="149" fill="url(#shadowFade)"/></mask></defs><g mask="url(#shadowMask)"><g transform="matrix(1 0 1 1 0 0) scale(1 1.4) translate(-24 -10)">${figure.replace(/<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g></g></svg>`}
            />
          </View>
          <Animated.View
            style={{
              position: "absolute",
              inset: 0,
              opacity: reduced
                ? 1
                : progress.interpolate({
                    inputRange: [0, 0.13, 0.51, 0.65, 1],
                    outputRange: [0, 1, 1, 0, 0],
                  }),
              transform: [
                {
                  translateX: reduced
                    ? 0
                    : progress.interpolate({
                        inputRange: [0, 0.51, 0.65, 1],
                        outputRange: [
                          0,
                          0,
                          -doorWidth * 0.35,
                          -doorWidth * 0.35,
                        ],
                      }),
                },
              ],
            }}
          >
            <SvgXml
              xml={figure}
              width={doorWidth * 1.15}
              height={doorHeight * 0.95}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      <View style={{ position: "absolute", bottom: 25 }}>
        <SuperAsset name="s3logo" width={145} height={28} opacity={0.2} />
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  cover: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
});
