import { Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { DetailPage, Section, DetailRow } from "../components/DetailUI";
import { Action, ui } from "../components/Page";
import { useEmailChange } from "../hooks/useEmailChange";
export default function Account() {
  const router = useRouter();
  const a = useEmailChange();
  return (
    <DetailPage
      title="アカウント管理"
      refreshing={a.loading}
      onRefresh={a.load}
    >
      {a.loading && <Text style={ui.muted}>読み込み中…</Text>}
      {!a.loading && !a.ready && (
        <Action title="再読み込み" disabled={a.busy} onPress={() => a.load()} />
      )}
      <Section title="現在のメールアドレス">
        <DetailRow title={a.email || "未取得"} icon="person-circle-outline" />
      </Section>
      <Section title="メールアドレスの変更">
        <TextInput
          editable={!a.busy && !a.loading && a.ready}
          style={ui.input}
          value={a.next}
          onChangeText={a.setNext}
          placeholder="新しいメールアドレス"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Action
          title="変更用コードを送る"
          disabled={a.busy || a.loading || !a.ready || !a.next.includes("@")}
          onPress={() => void a.send()}
        />
        {!!a.pending && (
          <>
            <Text>{a.email} に届いたコード</Text>
            <TextInput
              editable={!a.busy && !a.loading && a.ready}
              style={ui.input}
              value={a.oldCode}
              onChangeText={a.setOldCode}
              keyboardType="number-pad"
              maxLength={8}
            />
            <Action
              title="現在のメールを確認"
              disabled={a.busy || a.loading || !a.ready || a.oldCode.length < 6}
              onPress={() => void a.verify(a.email, a.oldCode)}
            />
            <Text>{a.pending} に届いたコード</Text>
            <TextInput
              editable={!a.busy && !a.loading && a.ready}
              style={ui.input}
              value={a.newCode}
              onChangeText={a.setNewCode}
              keyboardType="number-pad"
              maxLength={8}
            />
            <Action
              title="新しいメールを確認"
              disabled={a.busy || a.loading || !a.ready || a.newCode.length < 6}
              onPress={() => void a.verify(a.pending, a.newCode)}
            />
          </>
        )}
      </Section>
      {!!a.status && <Text>{a.status}</Text>}
      <Text style={ui.muted}>
        メールを失った場合の自動復旧には対応していません。
      </Text>
      <Section>
        <DetailRow
          title="アカウントを削除"
          danger
          onPress={() => router.push("/withdraw")}
        />
      </Section>
    </DetailPage>
  );
}
