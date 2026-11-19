import { useContext, useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "../hooks/useProfile";
import { Avatar } from "../components/Avatar";
import { NativeAction } from "../components/denshin/NativeAction";
import { ReducedIconMotion } from "../components/icons/IconMotion";
export default function Welcome() {
  const router = useRouter();
  const { profile } = useProfile();
  const reduced = useContext(ReducedIconMotion);
  const [remaining, setRemaining] = useState(10);
  const [scale] = useState(() => new Animated.Value(reduced ? 1 : 0.35));
  useEffect(() => {
    const animation = Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 24,
      stiffness: 85,
    });
    animation.start();
    const started = Date.now();
    const interval = setInterval(() => {
      const rest = Math.max(0, 10 - Math.floor((Date.now() - started) / 1000));
      setRemaining(rest);
      if (rest === 0) router.replace("/home");
    }, 250);
    return () => {
      animation.stop();
      clearInterval(interval);
    };
  }, [scale, router]);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
        padding: 30,
        justifyContent: "center",
        gap: 40,
      }}
    >
      <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
        <Avatar
          path={profile?.avatar_path}
          version={profile?.avatar_updated_at}
          name={profile?.display_name ?? ""}
          size={150}
        />
      </Animated.View>
      <Text
        style={{ fontFamily: "ui-rounded", fontSize: 25, textAlign: "center" }}
      >
        {profile?.display_name}さん{`\n`}利用を始めましょう！
      </Text>
      <View style={{ flexDirection: "row", gap: 3, marginTop: 45 }}>
        {Array.from({ length: 40 }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 16,
              borderRadius: 3,
              backgroundColor: "#01AE6B",
              opacity: i < remaining * 4 ? 1 : 0.12,
            }}
          />
        ))}
      </View>
      <Text style={{ textAlign: "center", color: "rgba(0,0,0,0.3)" }}>
        {remaining}秒後にホームへ移ります
      </Text>
      <NativeAction
        title="ホームへ"
        tone="blue"
        onPress={() => router.replace("/home")}
      />
    </SafeAreaView>
  );
}
