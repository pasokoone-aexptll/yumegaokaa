import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  AppState,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { useStreetMap } from "../hooks/useStreetMap";
import { useAutoVerifyCode } from "../hooks/useAutoVerifyCode";
import { localEntry } from "../lib/development";
import { SuperAsset } from "./icons/SuperAsset";
import { NativeAction } from "./denshin/NativeAction";
import { CodeInput } from "./denshin/CodeInput";
import { ReducedIconMotion } from "./icons/IconMotion";
import { OnboardingArtwork } from "./onboarding/OnboardingArtwork";
import { EntryProgress } from "./map/EntryProgress";
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
  authSuccess = false,
}: Props & { nextSendAt?: number; authSuccess?: boolean }) {
  const router = useRouter(),
    insets = useSafeAreaInsets();
  const reduced = useContext(ReducedIconMotion);
  const [started, setStarted] = useState(false),
    [existing, setExisting] = useState(false);
  const [height, setHeight] = useState(874),
    [now, setNow] = useState(Date.now);
  const [sendingCode, setSendingCode] = useState(false);
  const [formMotion] = useState(() => new Animated.Value(1));
  const stage = sent ? "code" : started ? "email" : "welcome";
  const title =
    stage === "welcome"
      ? "ようこそ"
      : existing
        ? "ログイン"
        : "アカウントを作成する";
  const [displayedTitle, setDisplayedTitle] = useState(title);
  const firstTitleEffect = useRef(true);
  const [titleMotion] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (firstTitleEffect.current) {
      firstTitleEffect.current = false;
      return;
    }
    let live = true;
    if (reduced) {
      setDisplayedTitle(title);
      titleMotion.setValue(1);
      return;
    }
    // Keep the outgoing heading until it has faded, then reveal the new one.
    const fadeOut = Animated.timing(titleMotion, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    });
    const fadeIn = Animated.timing(titleMotion, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });
    fadeOut.start(({ finished }) => {
      if (!finished || !live) return;
      setDisplayedTitle(title);
      fadeIn.start();
    });
    return () => {
      live = false;
      fadeOut.stop();
      fadeIn.stop();
    };
  }, [title, reduced, titleMotion]);
  useEffect(() => {
    formMotion.setValue(reduced ? 1 : 0);
    const move = Animated.sequence([
      Animated.delay(stage === "email" && !reduced ? 450 : 0),
      Animated.timing(formMotion, {
        toValue: 1,
        duration: reduced ? 0 : 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    move.start();
    return () => move.stop();
  }, [stage, reduced, formMotion]);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    if (!sent || nextSendAt <= Date.now()) return;
    const t = setInterval(() => {
      refresh();
      if (Date.now() >= nextSendAt) clearInterval(t);
    }, 250);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(t);
      subscription.remove();
    };
  }, [nextSendAt, sent]);
  const remaining = Math.max(0, Math.ceil((nextSendAt - now) / 1000));
  const canSend =
    !busy && !authSuccess && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  useAutoVerifyCode({
    address: email,
    code,
    enabled: sent && !authSuccess,
    busy,
    verify: async () => {
      Keyboard.dismiss();
      await login(false, !existing);
    },
  });
  async function sendCode(resend: boolean, createAccount: boolean) {
    setSendingCode(true);
    try {
      await login(resend, createAccount);
    } finally {
      setSendingCode(false);
    }
  }
  function choose(isExisting: boolean) {
    setExisting(isExisting);
    setStarted(true);
    setSent(false);
    setCode("");
    setError("");
  }
  const compact = height < 650;
  const top = Math.max(insets.top + 22, height * 0.145);
  const formTop = compact ? height * 0.53 : height * (sent ? 0.545 : 0.66);
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={s.root}
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      >
        <Animated.Text
          style={[
            s.title,
            {
              opacity: titleMotion,
              fontFamily: "OnboardingDot",
              fontSize: 32,
              lineHeight: 40,
              position: "absolute",
              top,
              left: 38,
            },
          ]}
        >
          {displayedTitle}
        </Animated.Text>
        <View style={{ position: "absolute", top: top + 86, left: 44 }}>
          <OnboardingArtwork stage={stage} scale={compact ? 0.65 : 1} />
        </View>
        {stage === "welcome" ? (
          <View style={[s.welcomeActions, { bottom: insets.bottom + 16 }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => choose(true)}
              style={{ paddingVertical: 10 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Text style={s.link}>すでにアカウントを持っている</Text>
                <SuperAsset
                  name="上矢印"
                  rotation={90}
                  size={14}
                  tint="rgba(0,0,0,0.8)"
                />
              </View>
              <Text style={s.fine}>ログインして街へ戻る</Text>
            </Pressable>
            <NativeAction
              title="アカウントを作成する"
              tone="neutral"
              contentWidth={282}
              onPress={() => choose(false)}
            />
          </View>
        ) : (
          <>
            <Animated.View
              style={{
                position: "absolute",
                left: 32,
                right: 32,
                top: formTop,
                opacity: formMotion,
                transform: [
                  {
                    translateY: formMotion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              }}
            >
              {sent ? (
                <>
                  <Text
                    style={[
                      s.title,
                      {
                        fontFamily: "OnboardingDot",
                        fontSize: 28,
                        marginBottom: 14,
                        color: "rgba(0,0,0,0.7)",
                      },
                    ]}
                  >
                    コードを入力
                  </Text>
                  <Text style={[s.note, { marginBottom: 18 }]}>
                    {existing
                      ? "ログイン用の6桁のコードをメールに送信しました"
                      : "登録用の6桁のコードをメールに送信しました"}
                  </Text>
                  <CodeInput
                    value={code}
                    onChange={setCode}
                    disabled={busy || authSuccess}
                    success={authSuccess}
                    grouped={false}
                  />
                  <View
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityLabel="コードの再送まで"
                    accessibilityValue={{
                      min: 0,
                      max: 60,
                      now: remaining,
                      text: `再送まで${remaining}秒`,
                    }}
                    style={s.resendGauge}
                  >
                    {Array.from({ length: 54 }, (_, index) => (
                      <View
                        key={index}
                        style={[
                          s.resendTick,
                          {
                            opacity:
                              0.08 +
                              0.55 *
                                Math.max(
                                  0,
                                  Math.min(
                                    1,
                                    ((nextSendAt - now) / 60000) * 54 - index,
                                  ),
                                ),
                          },
                        ]}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={[s.note, { fontSize: 16, marginBottom: 18 }]}>
                    {existing
                      ? "登録済みのメールアドレスを入力"
                      : "登録するメールアドレスを入力"}
                  </Text>
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
                    style={s.input}
                  />
                </>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
            </Animated.View>
            {sent ? (
              <View
                style={{
                  position: "absolute",
                  left: 28,
                  right: 28,
                  bottom: insets.bottom + 34,
                  gap: 18,
                  alignItems: "center",
                }}
              >
                {busy || authSuccess ? (
                  <>
                    <EntryProgress
                      success={authSuccess}
                      light
                      label={
                        authSuccess
                          ? "認証成功"
                          : sendingCode
                            ? "コード送信中"
                            : "認証中"
                      }
                    />
                    <Text style={[s.note, authSuccess && { color: "#01AE6B" }]}>
                      {authSuccess
                        ? "authentication successful"
                        : sendingCode
                          ? "コードを送信しています…"
                          : "認証しています…"}
                    </Text>
                  </>
                ) : (
                  <>
                    <Pressable
                      disabled={remaining > 0}
                      onPress={() => void sendCode(true, !existing)}
                    >
                      <Text style={s.note}>
                        {remaining
                          ? `再送まで${remaining}秒`
                          : "新しいコードを送る"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setSent(false);
                        setCode("");
                        setError("");
                      }}
                    >
                      <Text style={s.note}>メールアドレスを変更</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : existing ? (
              <View
                style={{
                  position: "absolute",
                  left: 28,
                  right: 28,
                  bottom: insets.bottom + 16,
                  gap: 16,
                }}
              >
                <NativeAction
                  title={busy ? "送信中…" : "ログインコードを送る"}
                  tone="blue"
                  contentWidth={240}
                  disabled={!canSend}
                  onPress={() => {
                    Keyboard.dismiss();
                    void sendCode(false, false);
                  }}
                />
                <Pressable onPress={() => choose(false)} disabled={busy}>
                  <Text style={[s.note, { textAlign: "center" }]}>
                    アカウントを作成する
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Animated.View
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: compact ? 0 : -10,
                  opacity: formMotion,
                  transform: [
                    {
                      translateY: formMotion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [150, 0],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="登録用コードを送る"
                  disabled={!canSend}
                  onPress={() => {
                    Keyboard.dismiss();
                    void sendCode(false, true);
                  }}
                  style={{
                    width: 270,
                    height: compact ? 95 : 176,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: compact ? 0 : 22,
                      left: 16,
                      zIndex: 1,
                      backgroundColor: "rgba(0,140,255,0.25)",
                      borderRadius: 18,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 14 }}>
                      {busy
                        ? "メールを送っています…"
                        : "僕をタッチして次へ進む"}
                    </Text>
                  </View>
                  <Image
                    source={require("../../assets/superassets/onboarding.gif")}
                    style={{
                      width: compact ? 270 : 350,
                      height: compact ? 329 : 426,
                      marginTop: compact ? 0 : -60,
                      opacity: 0.55,
                    }}
                    contentFit="contain"
                    autoplay={!reduced}
                  />
                </Pressable>
              </Animated.View>
            )}
            {!sent && (
              <Pressable
                disabled={busy}
                onPress={() => {
                  setStarted(false);
                  setError("");
                  Keyboard.dismiss();
                }}
                style={{
                  position: "absolute",
                  top: insets.top + 4,
                  right: 24,
                  padding: 10,
                }}
              >
                <Text style={s.note}>戻る</Text>
              </Pressable>
            )}
          </>
        )}
        {__DEV__ && (
          <Pressable
            style={{ position: "absolute", top: insets.top, right: 20 }}
            onPress={() => router.push("/ui-preview")}
          >
            <Text style={s.fine}>UIプレビュー</Text>
          </Pressable>
        )}
        {localEntry && (
          <Text style={[s.fine, { position: "absolute", bottom: 2, left: 28 }]}>
            開発用メールはMacのMailpitに届きます。
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "white" },
  resendGauge: {
    marginTop: 60,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,174,107,0.06)",
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  resendTick: {
    flex: 1,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#00AE6B",
  },
  title: {
    fontFamily: "ui-rounded",
    fontSize: 26,
    lineHeight: 34,
    color: "black",
  },
  welcomeActions: { position: "absolute", left: 28, right: 28, gap: 8 },
  link: { fontFamily: "ui-rounded", fontSize: 15, color: "rgba(0,0,0,0.8)" },
  note: {
    fontFamily: "ui-rounded",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(0,0,0,0.38)",
  },
  fine: {
    fontFamily: "ui-rounded",
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(0,0,0,0.22)",
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 27,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontFamily: "ui-rounded",
    fontSize: 17,
    height: 54,
  },
  error: { fontSize: 13, lineHeight: 19, color: "#FF3B30", marginTop: 10 },
});
