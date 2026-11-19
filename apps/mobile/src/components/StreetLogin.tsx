import { useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import type { useStreetMap } from "../hooks/useStreetMap";
import { localEntry } from "../lib/development";
import { ExitDoor } from "./denshin/ExitDoor";
import { NativeAction } from "./denshin/NativeAction";
import { CodeInput } from "./denshin/CodeInput";
import { SpeechBubble } from "./denshin/SpeechBubble";
import { ReducedIconMotion } from "./icons/IconMotion";
type Props = Pick<
  ReturnType<typeof useStreetMap>,
  | "email"
  | "setEmail"
  | "code"
  | "setCode"
  | "sent"
  | "setSent"
  | "error"
  | "setError"
  | "busy"
  | "login"
>;
export function StreetLogin({
  email,
  setEmail,
  code,
  setCode,
  sent,
  setSent,
  error,
  setError,
  busy,
  login,
  nextSendAt = 0,
}: Props & { nextSendAt?: number }) {
  const router = useRouter();
  const reduced = useContext(ReducedIconMotion);
  const [started, setStarted] = useState(false);
  const [existing, setExisting] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [motion] = useState(() => new Animated.Value(1));
  const stage = sent ? "code" : started ? "email" : "welcome";
  useEffect(() => {
    motion.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(motion, {
      toValue: 1,
      duration: reduced ? 0 : 450,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [stage, reduced, motion]);
  useEffect(() => {
    if (nextSendAt <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [nextSendAt]);
  const remaining = Math.max(0, Math.ceil((nextSendAt - now) / 1000));
  const disabled = busy || !email.trim() || (sent && !/^\d{6}$/.test(code));
  const note = { color: "rgba(0,0,0,0.4)", fontSize: 14, lineHeight: 22 };
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 26, paddingTop: 40 }}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            flexGrow: 1,
            opacity: motion,
            transform: [
              {
                translateY: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          }}
        >
          <Text
            style={{ fontFamily: "ui-rounded", fontSize: 27, marginBottom: 22 }}
          >
            {stage === "welcome"
              ? "ようこそ"
              : existing
                ? "ログイン"
                : "アカウントを作成する"}
          </Text>
          <ExitDoor size={210} />
          {stage === "welcome" ? (
            <>
              <View style={{ flex: 1, minHeight: 100 }} />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setExisting(true);
                  setStarted(true);
                }}
                style={{ paddingVertical: 20 }}
              >
                <Text style={{ fontFamily: "ui-rounded", fontSize: 16 }}>
                  すでにアカウントを持っている
                </Text>
              </Pressable>
              <NativeAction
                title="アカウントを作成する"
                tone="blue"
                onPress={() => {
                  setExisting(false);
                  setStarted(true);
                }}
              />
            </>
          ) : (
            <View style={{ gap: 22, flex: 1 }}>
              {sent ? (
                <>
                  <Text style={{ fontFamily: "ui-rounded", fontSize: 24 }}>
                    コードを入力
                  </Text>
                  <Text style={note}>
                    {email} に送信された6桁のコードを入力してください。
                  </Text>
                  <CodeInput value={code} onChange={setCode} disabled={busy} />
                </>
              ) : (
                <>
                  <View style={{ flex: 1, minHeight: 20 }} />
                  <Text style={note}>メールアドレスを入力</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    accessibilityLabel="メールアドレス"
                    editable={!busy}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    placeholder="メールアドレス"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.04)",
                      borderRadius: 24,
                      padding: 16,
                      fontFamily: "ui-rounded",
                      fontSize: 17,
                    }}
                  />
                </>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={{ color: "#FF3B30" }}>
                  {error}
                </Text>
              )}
              {busy ? (
                <ActivityIndicator style={{ margin: 20 }} />
              ) : (
                <NativeAction
                  tone="blue"
                  title={sent ? "確認する" : "次へ"}
                  disabled={disabled}
                  onPress={() => void login()}
                />
              )}
              {!sent && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="確認コードを送る"
                  disabled={disabled}
                  onPress={() => void login()}
                  style={{ alignSelf: "flex-end", alignItems: "center" }}
                >
                  <SpeechBubble color="rgba(0,140,255,0.7)">
                    <Text style={{ color: "white" }}>
                      僕をタッチして次へ進む
                    </Text>
                  </SpeechBubble>
                  <Image
                    source={require("../../assets/superassets/onboarding.gif")}
                    style={{ width: 180, height: 130 }}
                    contentFit="contain"
                    autoplay={!reduced}
                  />
                </Pressable>
              )}
              {sent && (
                <Pressable
                  disabled={busy || remaining > 0}
                  onPress={() => void login(true)}
                >
                  <Text style={note}>
                    {remaining
                      ? `再送まで${remaining}秒`
                      : "新しいコードを送る"}
                  </Text>
                </Pressable>
              )}
              {!sent && email.includes("@") && (
                <Pressable
                  disabled={busy}
                  onPress={() => {
                    setError("");
                    setSent(true);
                  }}
                >
                  <Text style={note}>届いているコードを入力</Text>
                </Pressable>
              )}
              {sent && (
                <Pressable
                  disabled={busy}
                  onPress={() => {
                    setSent(false);
                    setCode("");
                    setError("");
                    setStarted(true);
                  }}
                >
                  <Text style={note}>メールアドレスを変更</Text>
                </Pressable>
              )}
            </View>
          )}
          {__DEV__ && (
            <Pressable onPress={() => router.push("/ui-preview")}>
              <Text style={note}>開発用 UIプレビュー</Text>
            </Pressable>
          )}
          {localEntry && (
            <Text style={note}>開発用メールはMacのMailpitに届きます。</Text>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
