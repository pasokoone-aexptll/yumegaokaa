import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { useStreetMap } from "../hooks/useStreetMap";
import { localEntry } from "../lib/development";

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
}: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <ImageBackground
          source={require("../../assets/figma-map/yuuyake.png")}
          style={s.hero}
        >
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#00000026" }]}
          />
          <SafeAreaView edges={["top"]} style={{ gap: 12 }}>
            <Image
              source={require("../../assets/figma-map/DreamCloud.png")}
              style={{ width: 120, height: 96 }}
              resizeMode="contain"
            />
            <Text style={s.brand}>夢ヶ丘オラクル</Text>
            <Text style={s.subtitle}>接続センター アシスタント</Text>
          </SafeAreaView>
        </ImageBackground>
        <View style={s.body}>
          <Text style={s.heading}>
            {sent ? "メールを確認" : "夢ヶ丘にログイン"}
          </Text>
          <Text style={s.note}>
            {sent
              ? `${email} に確認コードを送りました。`
              : "招待されたメールアドレスを入力してください。"}
          </Text>
          <View style={s.card}>
            <Text style={s.label}>
              {sent ? "確認コード" : "メールアドレス"}
            </Text>
            {sent ? (
              <TextInput
                style={[s.input, { fontSize: 28, letterSpacing: 6 }]}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                placeholder="000000"
                placeholderTextColor="#00000033"
                value={code}
                onChangeText={setCode}
                accessibilityLabel="メールの確認コード"
              />
            ) : (
              <TextInput
                style={s.input}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="name@example.com"
                placeholderTextColor="#00000033"
                value={email}
                onChangeText={setEmail}
                accessibilityLabel="メールアドレス"
              />
            )}
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: "#c32b40" }}>
              {error}
            </Text>
          )}
          <View style={{ flex: 1, minHeight: 24 }} />
          <Pressable
            accessibilityRole="button"
            style={[s.button, (busy || !email) && { opacity: 0.5 }]}
            disabled={busy || !email}
            onPress={login}
          >
            {busy ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Text style={s.buttonText}>
                {sent ? "ログイン" : "確認コードを送る"}
              </Text>
            )}
          </Pressable>
          {sent && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setSent(false);
                setCode("");
                setError("");
              }}
              style={{ padding: 12, alignItems: "center" }}
            >
              <Text style={s.note}>メールアドレスを確認・コードを再送</Text>
            </Pressable>
          )}
          {localEntry && (
            <Text style={s.note}>開発用メールはMacのMailpitに届きます。</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  hero: { minHeight: 280, padding: 28, justifyContent: "flex-end" },
  brand: { color: "white", fontSize: 24, fontWeight: "600" },
  subtitle: { color: "#ffffffb3", fontSize: 13 },
  body: { flexGrow: 1, padding: 24, paddingBottom: 40, gap: 18 },
  heading: { fontSize: 28, fontWeight: "700", color: "#000000e6" },
  note: { color: "#00000080", fontSize: 14, lineHeight: 21 },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    borderCurve: "continuous",
    padding: 20,
    gap: 10,
  },
  label: { color: "#00000080", fontSize: 13, fontWeight: "600" },
  input: { color: "#111", fontSize: 18, minHeight: 48 },
  button: {
    backgroundColor: "white",
    borderRadius: 28,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 17, fontWeight: "600", color: "#111" },
});
