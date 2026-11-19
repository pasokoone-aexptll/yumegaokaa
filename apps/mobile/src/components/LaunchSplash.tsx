import { createContext, memo, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  SvgXml,
} from "react-native-svg";
import assets from "./icons/superassets.json";
import { MapAsset } from "./map/MapAsset";

// Reuse the supplied running figure, including its original silhouette.
const figure = assets["非常口の人物"].replace(/fill="#[^"]*"/g, 'fill="white"');
export const SplashPlayingContext = createContext(false);
export const LaunchSplash = memo(function LaunchSplash({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduced(value);
    });
    return () => {
      alive = false;
    };
  }, []);
  const { width, height } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (reduced === null) return;
    progress.setValue(0);
    const motion = Animated.sequence([
      Animated.delay(reduced ? 0 : 100),
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 200 : 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    // Start only after the initial SVG/layout commit and accessibility preference resolve.
    const frame = requestAnimationFrame(() =>
      motion.start(({ finished: done }) => {
        if (done) {
          setFinished(true);
          onComplete();
        }
      }),
    );
    return () => {
      cancelAnimationFrame(frame);
      motion.stop();
    };
  }, [progress, reduced, onComplete]);
  if (finished) return null;
  const doorWidth = width * 0.244;
  const doorHeight = doorWidth * 1.49;
  const zoom = Math.max(width / doorWidth, height / doorHeight) * 1.15;
  const opacity = progress.interpolate({
    inputRange: [0, 0.95, 1],
    outputRange: [1, 1, 0],
  });
  const scale = reduced
    ? 1
    : progress.interpolate({
        inputRange: [0, 0.528, 0.56, 0.59, 0.62, 0.65, 0.68, 0.72, 0.78, 1],
        outputRange: [1, 1, 1.13, 1.57, 2.2, 2.89, 3.87, 4.76, zoom, zoom],
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
              xml={`<svg viewBox="0 0 280 149" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="shadowFade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity="1"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="shadowMask"><rect width="280" height="149" fill="url(#shadowFade)"/></mask></defs><g mask="url(#shadowMask)"><g transform="matrix(1 0 -1 -1 149 149) scale(1.77 1.77) translate(-24 -10)">${figure.replace(/<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g></g></svg>`}
            />
          </View>
          <Animated.View
            style={{
              position: "absolute",
              inset: 0,
              opacity: reduced
                ? 1
                : progress.interpolate({
                    inputRange: [0, 0.472, 0.61, 1],
                    outputRange: [1, 1, 0, 0],
                  }),
              transform: [
                {
                  translateX: reduced
                    ? 0
                    : progress.interpolate({
                        inputRange: [0, 0.472, 0.61, 1],
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
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: doorWidth * 2.8,
              height: doorHeight * 2.2,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "white",
                transform: [
                  {
                    translateX: reduced
                      ? doorWidth * 2.8
                      : progress.interpolate({
                          inputRange: [0, 0.28, 1],
                          outputRange: [0, doorWidth * 2.8, doorWidth * 2.8],
                        }),
                  },
                ],
              }}
            />
          </View>
        </Animated.View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "white",
            opacity: reduced
              ? 0
              : progress.interpolate({
                  inputRange: [0, 0.78, 0.95, 1],
                  outputRange: [0, 0, 1, 1],
                }),
          },
        ]}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: 25,
          opacity: progress.interpolate({
            inputRange: [0, 0.01, 1],
            outputRange: [0, 1, 1],
          }),
        }}
      >
        <MapAsset
          name="DreamCloud Logo"
          width={145}
          height={28}
          tint="black"
          fillOpacity={0.2}
        />
      </Animated.View>
    </Animated.View>
  );
});
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
