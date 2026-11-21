import { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeAction } from "../denshin/NativeAction";
import { SvgXml } from "react-native-svg";
import assets from "../icons/superassets.json";
import { SuperAsset } from "../icons/SuperAsset";
import { ReducedIconMotion } from "../icons/IconMotion";
const atmark = assets.atmark
  .replace(/fill="black"/g, 'fill="url(#at-blue)"')
  .replace(/fill-opacity="[^"]*"/g, "")
  .replace(
    "</svg>",
    '<defs><linearGradient id="at-blue" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2D89FF"/><stop offset="1" stop-color="#2D89FF" stop-opacity="0.65"/></linearGradient></defs></svg>',
  );
export function ProfileSetup({
  stage,
  name,
  onName,
  busy,
  error,
  onNext,
  onExit,
}: {
  stage: "name" | "photo" | "pool";
  name?: string;
  onName?: (v: string) => void;
  busy: boolean;
  error?: string;
  onNext: () => void;
  onExit?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets(),
    reduced = useContext(ReducedIconMotion);
  const [sceneEntrance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(sceneEntrance, {
      toValue: 1,
      duration: reduced ? 0 : 650,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [sceneEntrance, reduced]);
  const [displayedStage, setDisplayedStage] = useState(stage);
  const previousStage = useRef(stage);
  const [motion] = useState(() => new Animated.Value(550));
  const [enteringScene, setEnteringScene] = useState(true);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const changed = previousStage.current !== stage;
    previousStage.current = stage;
    if (reduced) {
      setDisplayedStage(stage);
      setLeaving(false);
      motion.setValue(1200);
      return;
    }
    let live = true;
    motion.stopAnimation();
    setLeaving(changed);
    setEnteringScene(!changed);
    motion.setValue(changed ? 0 : 550);
    const enter = () => {
      if (!live) return;
      setDisplayedStage(stage);
      setLeaving(false);
      Animated.timing(motion, {
        toValue: 1200,
        duration: changed ? 850 : 650,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    };
    if (changed) {
      Animated.timing(motion, {
        toValue: 350,
        duration: 350,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) enter();
      });
    } else enter();
    return () => {
      live = false;
      motion.stopAnimation();
    };
  }, [stage, reduced, motion]);
  const bodyOpacity = motion.interpolate({
    inputRange: leaving
      ? [0, 200, 350]
      : enteringScene
        ? [550, 650, 850, 1200]
        : [350, 830, 1050, 1200],
    outputRange: leaving ? [1, 1, 0] : [0, 0, 1, 1],
    extrapolate: "clamp",
  });
  const bodyY = motion.interpolate({
    inputRange: [0, 150, 200, 250, 300, 350],
    outputRange: leaving ? [0, 0, 8, 40, 72, 80] : [0, 0, 0, 0, 0, 0],
    extrapolate: "clamp",
  });
  const buttonOpacity = motion.interpolate({
    inputRange: leaving
      ? [0, 150, 1200]
      : enteringScene
        ? [550, 750, 950]
        : [350, 1000, 1200],
    outputRange: leaving ? [1, 0, 0] : [0, 0, 1],
    extrapolate: "clamp",
  });
  const buttonY = motion.interpolate({
    inputRange: leaving
      ? [0, 150, 1200]
      : enteringScene
        ? [550, 750, 950]
        : [350, 1000, 1200],
    outputRange: leaving ? [0, 20, 20] : [20, 20, 0],
    extrapolate: "clamp",
  });
  const badge = motion.interpolate({
    inputRange: [350, 750, 900, 1200],
    outputRange: [0, 0, 1, 1],
    extrapolate: "clamp",
  });
  const top = Math.max(insets.top + 32, height * 0.145);
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.root}>
        {onExit && (
          <Pressable
            onPress={onExit}
            disabled={busy}
            style={{
              position: "absolute",
              top: insets.top + 4,
              right: 24,
              padding: 10,
            }}
          >
            <Text style={s.note}>別のアカウントでログイン</Text>
          </Pressable>
        )}
        <Animated.View
          style={{
            position: "absolute",
            top: top - 20,
            left: 12,
            opacity: enteringScene
              ? motion.interpolate({
                  inputRange: [550, 750],
                  outputRange: [0, 1],
                  extrapolate: "clamp",
                })
              : 1,
          }}
        >
          <SvgXml xml={atmark} width={124} height={124} />
          {displayedStage !== "name" && (
            <Animated.View
              style={{
                position: "absolute",
                opacity: badge,
                transform: [{ scale: badge }],
                right: -7,
                bottom: 4,
                width: 56,
                height: 56,
                borderRadius: 28,
                overflow: "hidden",
                backgroundColor: "white",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  ...StyleSheet.absoluteFill,
                  backgroundColor: "rgba(0,0,0,0.1)",
                }}
              />
              <View style={{ position: "absolute", top: 0, left: -9 }}>
                <SuperAsset
                  name="user-fill"
                  size={74}
                  tint="black"
                  opacity={0.55}
                />
              </View>
            </Animated.View>
          )}
        </Animated.View>
        <Animated.Image
          source={require("../../../assets/superassets/DreamCloud.png")}
          style={{
            position: "absolute",
            top: height * 0.335,
            right: -122,
            width: 360,
            height: 330,
            opacity: sceneEntrance.interpolate({
              inputRange: [0, 0.3, 0.92, 1],
              outputRange: [0, 0, 0.55, 0.55],
            }),
            transform: [
              {
                translateX: sceneEntrance.interpolate({
                  inputRange: [0, 0.3, 0.92, 1],
                  outputRange: [100, 100, 0, 0],
                }),
              },
            ],
          }}
          resizeMode="contain"
        />
        <Animated.View
          style={{
            position: "absolute",
            top: top + 145,
            left: 32,
            right: 32,
            gap: 20,
          }}
        >
          <Animated.View
            style={{
              gap: 20,
              opacity: bodyOpacity,
              transform: [{ translateY: bodyY }],
            }}
          >
            <Text style={s.title}>
              {displayedStage === "name"
                ? "名前を決める"
                : displayedStage === "photo"
                  ? "プロフィール写真"
                  : "Pool Random写真を追加"}
            </Text>
            <Text style={s.note}>
              {displayedStage === "name"
                ? "ユーザー名は街チャットや電信PINに表示されます。"
                : displayedStage === "photo"
                  ? "この画像はチャットや電信PINで、あなたの発言だとわかる必要がある場合に使われます。"
                  : "地図上で表示されるアイコンはPoolの写真からランダムに選ばれます。匿名性を守るための画像を選んでください。"}
            </Text>
            {displayedStage === "name" && (
              <View style={s.inputRow}>
                <SuperAsset name="atmark" size={35} tint="rgba(0,0,0,0.45)" />
                <TextInput
                  accessibilityLabel="名前"
                  value={name}
                  onChangeText={onName}
                  editable={!busy}
                  maxLength={50}
                  placeholder="名前"
                  style={s.input}
                />
              </View>
            )}
          </Animated.View>
          <Animated.View
            style={{
              marginTop: displayedStage === "name" ? 0 : 80,
              opacity: buttonOpacity,
              transform: [{ translateY: buttonY }],
            }}
          >
            <NativeAction
              title={
                busy
                  ? "保存しています…"
                  : displayedStage === "name"
                    ? "次へ"
                    : "カメラロールを開く"
              }
              tone="black"
              trailingIcon="上矢印"
              trailingRotation={90}
              trailingSize={14}
              trailingTint="rgba(255,255,255,0.65)"
              contentWidth={width - 104}
              contentAlign="start"
              labelStyle={{
                color: "rgba(255,255,255,0.65)",
                fontWeight: "400",
                fontSize: displayedStage === "name" ? 18 : 22,
              }}
              disabled={
                busy ||
                leaving ||
                stage !== displayedStage ||
                (displayedStage === "name" && !name?.trim())
              }
              onPress={() => {
                Keyboard.dismiss();
                onNext();
              }}
            />
          </Animated.View>
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={{ color: "#FF3B30", fontSize: 14 }}
            >
              {error}
            </Text>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "white" },
  title: { fontFamily: "OnboardingDot", fontSize: 28, lineHeight: 38 },
  note: {
    fontFamily: "ui-rounded",
    fontSize: 16,
    lineHeight: 20,
    color: "rgba(0,0,0,0.5)",
  },
  inputRow: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 27,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    fontFamily: "ui-rounded",
    fontSize: 22,
    fontWeight: "600",
    height: 54,
    flex: 1,
  },
});
