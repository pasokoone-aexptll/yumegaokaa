import { Alert, Text, TextInput } from "react-native";
import { Action, Page, ui } from "../components/Page";
import { useWithdrawal } from "../hooks/useWithdrawal";
export default function Withdraw() {
  const { request, code, setCode, busy, error, begin, finish } =
    useWithdrawal();
  return (
    <Page title="退会">
      <Text>
        滞在とPINを終了し、プロフィールと投稿本文を削除します。関連する通報の証拠も原則削除します。画像・認証情報は順次削除処理を行います。元には戻せません。
      </Text>
      {!request ? (
        <Action
          title="本人確認コードを送る"
          disabled={busy}
          onPress={() => void begin()}
        />
      ) : (
        <>
          <Text>{request.email}</Text>
          <TextInput
            editable={!busy}
            style={ui.input}
            value={code}
            onChangeText={setCode}
            placeholder="確認コード"
            keyboardType="number-pad"
            maxLength={8}
          />
          <Action
            title="退会する"
            disabled={busy || code.length < 6}
            onPress={() =>
              Alert.alert("退会しますか？", "この操作は取り消せません。", [
                { text: "戻る", style: "cancel" },
                {
                  text: "退会",
                  style: "destructive",
                  onPress: () => void finish(),
                },
              ])
            }
          />
          <Action
            title="コードを送り直す"
            disabled={busy}
            onPress={() => void begin()}
          />
        </>
      )}
      {!!error && <Text style={ui.error}>{error}</Text>}
    </Page>
  );
}
