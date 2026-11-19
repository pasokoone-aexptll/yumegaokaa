import { useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { DetailPage } from "../components/DetailUI";
import { OperatorForm } from "../components/settings/OperatorForm";
import { Action, Empty, ui } from "../components/Page";
import { useOperatorDashboard } from "../hooks/useOperatorDashboard";
export default function Screen() {
  const dashboard = useOperatorDashboard();
  return <AdminView dashboard={dashboard} />;
}
export function AdminView({
  dashboard,
}: {
  dashboard: ReturnType<typeof useOperatorDashboard>;
}) {
  const router = useRouter();
  const {
    operator,
    ready,
    busy,
    error,
    factor,
    secret,
    code,
    setCode,
    enroll,
    verify,
    refresh,
  } = dashboard;
  return (
    <DetailPage title="運営" onRefresh={refresh} refreshing={busy}>
      {!!error && <Text style={ui.error}>{error}</Text>}
      {!operator ? (
        <Empty>
          運営資格が必要です。一般アカウントから資格を取得することはできません。
        </Empty>
      ) : !ready ? (
        <View style={ui.card}>
          <Text>運営操作には認証アプリのワンタイムコードが必要です。</Text>
          {!factor && (
            <Action
              title="認証アプリを登録"
              disabled={busy}
              onPress={() => void enroll()}
            />
          )}
          {!!secret && (
            <>
              <Text>
                認証アプリへ設定キーを登録してください。画面を離れると非表示になります。
              </Text>
              <Text selectable testID="totp-setup-key">
                {secret}
              </Text>
            </>
          )}
          {!!factor && (
            <>
              <TextInput
                accessibilityLabel="認証アプリのコード"
                style={ui.input}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="6桁のコード"
              />
              <Action
                title="追加認証"
                disabled={busy || code.length !== 6}
                onPress={() => void verify()}
              />
            </>
          )}
        </View>
      ) : (
        <OperatorForm data={dashboard} open={(path) => router.push(path)} />
      )}
    </DetailPage>
  );
}
