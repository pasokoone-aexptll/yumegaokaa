import { useContext, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { useProfile } from "../hooks/useProfile";
import { Avatar } from "../components/Avatar";
import { OnboardingArtwork } from "../components/onboarding/OnboardingArtwork";
import { ReducedIconMotion } from "../components/icons/IconMotion";
export default function Welcome() {
  const router = useRouter();
  const { profile } = useProfile();
  return (
    <WelcomeView
      name={profile?.display_name ?? ""}
      avatarPath={profile?.avatar_path}
      avatarVersion={profile?.avatar_updated_at}
      onComplete={() => router.replace("/home")}
    />
  );
}
export function WelcomeView({
  name,
  avatarPath,
  avatarVersion,
  onComplete,
}: {
  name: string;
  avatarPath?: string | null;
  avatarVersion?: string | null;
  onComplete: () => void;
}) {
  const { width, height } = useWindowDimensions(),
    reduced = useContext(ReducedIconMotion);
  // Final portrait geometry from the 786 × 1720 reference video.
  const portraitDiameter = width * (478 / 786);
  const portraitBorder = portraitDiameter * (34 / 478);
  const [remaining, setRemaining] = useState(10),
    [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const a = Animated.timing(motion, {
      toValue: 1,
      duration: reduced ? 0 : 6500,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [motion, reduced]);
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(
      () =>
        setRemaining(
          Math.max(0, 10 - Math.max(0, Date.now() - started - 2000) / 1000),
        ),
      100,
    );
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (remaining === 0) onComplete();
  }, [remaining, onComplete]);
  const opening = motion.interpolate({
    inputRange: [0, 0.073, 0.411, 0.513, 1],
    outputRange: [0, 1, 1, 0, 0],
  });
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Animated.View
        style={{
          position: "absolute",
          left: 44,
          top: height * 0.244,
          opacity: motion.interpolate({
            inputRange: [0, 0.58, 0.62, 1],
            outputRange: [1, 1, 0, 0],
          }),
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            width: 78,
            height: 116,
            backgroundColor: "#00AF6B",
            transformOrigin: "right center",
            transform: [{ scaleX: opening }],
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 116,
            width: 78,
            height: 131,
            transformOrigin: "top left",
            transform: [{ skewX: "45deg" }],
          }}
        >
          <Animated.View
            style={{
              width: 78,
              height: 131,
              transformOrigin: "right center",
              transform: [{ scaleX: opening }],
            }}
          >
            <Svg width={78} height={131}>
              <Defs>
                <LinearGradient id="welcome-floor" x1="0" y1="0" x2="0" y2="1">
                  <Stop stopColor="#00AF6B" stopOpacity={0.55} />
                  <Stop offset="1" stopColor="#00AF6B" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width={78} height={131} fill="url(#welcome-floor)" />
            </Svg>
          </Animated.View>
        </View>
        <OnboardingArtwork
          hideDoorway
          stage="code"
          codeFigureOpacity={motion.interpolate({
            inputRange: [0, 0.095, 0.12, 0.411, 0.513, 1],
            outputRange: [0, 0, 1, 1, 0, 0],
          })}
        />
      </Animated.View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 44,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: height * (402 / 1720),
            left: width * (375 / 786) - portraitDiameter / 2 - 44,
            opacity: motion.interpolate({
              inputRange: [0, 0.14, 0.15, 1],
              outputRange: [0, 0, 1, 1],
            }),
            transform: [
              {
                translateX: motion.interpolate({
                  inputRange: [0, 0.14, 0.16, 0.235, 1],
                  outputRange: [
                    -width * 0.6,
                    -width * 0.6,
                    -width * (298 / 786),
                    0,
                    0,
                  ],
                }),
              },
              {
                translateY: motion.interpolate({
                  inputRange: [0, 0.62, 0.64, 0.68, 0.74, 0.78, 0.84, 1],
                  outputRange: [-45, -45, -41, -30, -10, -1.5, 0, 0],
                }),
              },
              {
                scale: motion.interpolate({
                  inputRange: [0, 0.62, 0.64, 0.68, 0.74, 0.78, 0.84, 1],
                  outputRange: [0.43, 0.43, 0.48, 0.62, 0.87, 0.98, 1, 1],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              padding: portraitBorder,
              borderRadius: portraitDiameter / 2,
              backgroundColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Avatar
              path={avatarPath ?? undefined}
              version={avatarVersion ?? undefined}
              name={name}
              size={portraitDiameter - 2 * portraitBorder}
            />
          </View>
        </Animated.View>
      </View>
      <Animated.View
        style={{
          position: "absolute",
          left: width * (94 / 786),
          right: 24,
          top: height * 0.57,
          opacity: motion.interpolate({
            inputRange: [0, 0.78, 1],
            outputRange: [0, 0, 1],
          }),
          transform: [
            {
              translateY: motion.interpolate({
                inputRange: [0, 0.78, 1],
                outputRange: [10, 10, 0],
              }),
            },
          ],
        }}
      >
        <Text
          style={{ fontFamily: "ui-rounded", fontSize: 28, lineHeight: 34 }}
        >
          {name}さん{`\n`}利用を始めましょう！
        </Text>
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 34,
          right: 34,
          top: height * 0.79,
          opacity: motion.interpolate({
            inputRange: [0, 0.28, 0.34, 1],
            outputRange: [0, 0, 1, 1],
          }),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ホームへ進む"
          onPress={onComplete}
          style={{
            gap: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 2,
              padding: 4,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: "rgba(1,174,107,0.08)",
            }}
          >
            {Array.from({ length: 50 }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 16,
                  borderRadius: 2,
                  backgroundColor: "#01AE6B",
                  opacity: i / 50 < remaining / 10 ? 1 : 0.1,
                }}
              />
            ))}
          </View>
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontSize: 12,
              color: "rgba(0,0,0,0.25)",
            }}
          >
            10秒後に自動でホームへ遷移します
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
