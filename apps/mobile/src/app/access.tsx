import { useContext, useState } from "react";
import { Text } from "react-native";
import { Action, Page, ui } from "../components/Page";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import { native } from "../lib/native";
export default function Access() {
  const { status, retry } = useContext(AccountAccessContext);
  const [error, setError] = useState("");
  return (
    <Page
      title={
        status === "withdrawn"
          ? "退会済み"
          : status === "expired"
            ? "再ログインが必要です"
            : "利用停止中"
      }
    >
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action title="状態を確認" onPress={retry} />
      <Action
        title="ログアウト"
        onPress={() => {
          void native
            .logout()
            .catch(() => setError("ログアウトを確認できませんでした"));
        }}
      />
    </Page>
  );
}
