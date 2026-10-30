import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Action, Page, ui } from "../components/Page";
import { useEmailChange } from "../hooks/useEmailChange";
export default function Account() {
  const a = useEmailChange();
  return (
    <Page title="アカウント管理">
      <Text>{a.email}</Text>
      <View style={ui.card}>
        <TextInput
          style={ui.input}
          value={a.next}
          onChangeText={a.setNext}
          placeholder="新しいメールアドレス"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Action
          title="変更用コードを送る"
          disabled={a.busy || !a.next.includes("@")}
          onPress={() => void a.send()}
        />
        {!!a.pending && (
          <>
            <Text>{a.email} に届いたコード</Text>
            <TextInput
              style={ui.input}
              value={a.oldCode}
              onChangeText={a.setOldCode}
              keyboardType="number-pad"
              maxLength={8}
            />
            <Action
              title="現在のメールを確認"
              disabled={a.busy || a.oldCode.length < 6}
              onPress={() => void a.verify(a.email, a.oldCode)}
            />
            <Text>{a.pending} に届いたコード</Text>
            <TextInput
              style={ui.input}
              value={a.newCode}
              onChangeText={a.setNewCode}
              keyboardType="number-pad"
              maxLength={8}
            />
            <Action
              title="新しいメールを確認"
              disabled={a.busy || a.newCode.length < 6}
              onPress={() => void a.verify(a.pending, a.newCode)}
            />
          </>
        )}
      </View>
      {!!a.status && <Text>{a.status}</Text>}
      <Text style={ui.muted}>
        メールを失った場合の自動復旧には対応していません。
      </Text>
      <Action title="退会" onPress={() => router.push("/withdraw")} />
    </Page>
  );
}
