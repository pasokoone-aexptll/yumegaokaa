import { useRef, useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginForReview } from "../../lib/native";
import { Action, ui } from "../Page";

export function AppReviewLogin({ back }: { back(): void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await loginForReview(email.trim(), password);
    } catch {
      setError("ログインできませんでした。審査用の認証情報と接続を確認してください。");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return <SafeAreaView style={{ flex: 1 }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text accessibilityRole="header">App Review ログイン</Text>
      <Text>審査専用の街に接続します。</Text>
      <TextInput style={ui.input} accessibilityLabel="審査用メール" placeholder="メールアドレス" autoCapitalize="none" autoCorrect={false} spellCheck={false} textContentType="username" keyboardType="email-address" editable={!busy} onChangeText={setEmail} />
      <TextInput style={ui.input} accessibilityLabel="審査用パスワード" placeholder="パスワード" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" editable={!busy} onChangeText={setPassword} />
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      <Action title="ログイン" disabled={busy || !email.trim() || !password} onPress={() => void submit()} />
      <Action title="戻る" disabled={busy} onPress={back} />
    </ScrollView>
  </SafeAreaView>;
}
