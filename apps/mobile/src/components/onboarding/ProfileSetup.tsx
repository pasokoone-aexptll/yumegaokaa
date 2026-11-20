import { useContext, useEffect, useState } from "react";
import {
  Animated,
  Image,
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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets(),
    reduced = useContext(ReducedIconMotion);
  const [height, setHeight] = useState(874),
    [motion] = useState(() => new Animated.Value(1));
  useEffect(() => {
    motion.setValue(reduced ? 1 : 0);
    const a = Animated.timing(motion, {
      toValue: 1,
      duration: reduced ? 0 : 450,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [stage, reduced, motion]);
  const top = Math.max(insets.top + 32, height * 0.145);
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={s.root}
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      >
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
        <View style={{ position: "absolute", top: top - 20, left: 12 }}>
          <SvgXml xml={atmark} width={124} height={124} />
          {stage !== "name" && (
            <View
              style={{
                position: "absolute",
                right: 10,
                bottom: 6,
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(0,0,0,0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SuperAsset name="user-fill" size={27} tint="rgba(0,0,0,0.5)" />
            </View>
          )}
        </View>
        <Image
          source={require("../../../assets/superassets/DreamCloud.png")}
          style={{
            position: "absolute",
            top: height * 0.38,
            right: -90,
            width: 360,
            height: 330,
            opacity: 0.55,
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
            opacity: motion,
            transform: [
              {
                translateX: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <Text style={s.title}>
            {stage === "name"
              ? "名前を決める"
              : stage === "photo"
                ? "プロフィール写真"
                : "Pool Random写真を追加"}
          </Text>
          <Text style={s.note}>
            {stage === "name"
              ? "ユーザー名は街チャットや電信PINに表示されます。"
              : stage === "photo"
                ? "この画像はチャットや電信PINで、あなたの発言だとわかる必要がある場合に使われます。"
                : "地図上で表示されるアイコンはPoolの写真からランダムに選ばれます。匿名性を守るための画像を選んでください。"}
          </Text>
          {stage === "name" && (
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
          <View style={{ marginTop: stage === "name" ? 0 : 80 }}>
            <NativeAction
              title={
                busy
                  ? "保存しています…"
                  : stage === "name"
                    ? "次へ"
                    : "カメラロールを開く"
              }
              tone="black"
              trailingIcon="上矢印"
              trailingRotation={90}
              contentWidth={width - 104}
              contentAlign="start"
              labelStyle={{
                color: "rgba(255,255,255,0.65)",
                fontWeight: "400",
                fontSize: stage === "name" ? 18 : 22,
              }}
              disabled={busy || (stage === "name" && !name?.trim())}
              onPress={() => {
                Keyboard.dismiss();
                onNext();
              }}
            />
          </View>
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
    color: "rgba(0,0,0,0.38)",
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
