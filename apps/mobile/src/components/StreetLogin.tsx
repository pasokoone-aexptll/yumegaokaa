import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { useStreetMap } from "../hooks/useStreetMap";
import { localEntry } from "../lib/development";
import { streetMapStyles as styles } from "./streetMapStyles";

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4fbff" }}>
      <ScrollView
        contentContainerStyle={[styles.login, { flex: undefined, flexGrow: 1 }]}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.logo}>夢ヶ丘</Text>
        <Text style={styles.label}>招待されたメールでログイン</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardType="email-address"
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
        />
        {sent && (
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="メールの確認コード"
            value={code}
            onChangeText={setCode}
          />
        )}
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          disabled={busy || !email}
          onPress={login}
        >
          <Text style={styles.buttonText}>
            {busy ? "確認中…" : sent ? "ログイン" : "確認コードを送る"}
          </Text>
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
          >
            <Text style={styles.link}>メールアドレスを確認・コードを再送</Text>
          </Pressable>
        )}
        <Text style={styles.error}>{error}</Text>
        {localEntry && (
          <Text style={styles.note}>
            開発用メールはMacのMailpitに届きます。
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
