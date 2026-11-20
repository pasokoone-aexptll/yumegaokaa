import { useContext, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
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
        <OnboardingArtwork stage="code" />
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 220,
            height: 250,
            backgroundColor: "white",
            transform: [
              {
                translateX: motion.interpolate({
                  inputRange: [0, 0.13, 0.45, 0.6, 1],
                  outputRange: [0, 220, 220, 0, 0],
                }),
              },
            ],
          }}
        />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          top: height * 0.237,
          left: (width - 232) / 2,
          opacity: motion.interpolate({
            inputRange: [0, 0.12, 0.2, 1],
            outputRange: [0, 0, 1, 1],
          }),
          transform: [
            {
              translateX: motion.interpolate({
                inputRange: [0, 0.12, 0.32, 1],
                outputRange: [-width * 0.28, -width * 0.28, 0, 0],
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
            padding: 15,
            borderRadius: 116,
            backgroundColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Avatar
            path={avatarPath ?? undefined}
            version={avatarVersion ?? undefined}
            name={name}
            size={202}
          />
        </View>
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 46,
          right: 24,
          top: height * 0.58,
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
          style={{ fontFamily: "ui-rounded", fontSize: 25, lineHeight: 32 }}
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
