import { router } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { useOperatorDashboard } from "../hooks/useOperatorDashboard";
export default function Screen() {
  const {
    operator,
    ready,
    busy,
    error,
    factor,
    secret,
    code,
    setCode,
    invites,
    summary,
    more,
    enroll,
    verify,
    revoke,
    refresh,
    next,
  } = useOperatorDashboard();
  return (
    <Page title="運営">
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
        <>
          <Empty>
            参加者 {summary?.active_members}人・有効な招待{" "}
            {summary?.active_invitations}件
          </Empty>
          <Action
            title="参加者・招待枠・利用停止"
            onPress={() => router.push("/members")}
          />
          <Action title="通報対応" onPress={() => router.push("/moderation")} />
          <Action
            title="ステッカー管理"
            onPress={() => router.push("/stickers")}
          />
          <Text style={ui.title}>招待の監督</Text>
          <Action
            title="最新の状態を取得"
            disabled={busy}
            onPress={() => void refresh()}
          />
          {!invites.length && <Empty>招待はありません。</Empty>}
          {invites.map((i) => (
            <View key={i.id} style={ui.card}>
              <Text>
                {i.issuer_name ?? "名前未設定"} →{" "}
                {i.recipient_name ?? (i.used_at ? "参加済み" : "未使用")}
              </Text>
              <Text>
                {i.revoked_at
                  ? "無効化済み"
                  : `期限 ${new Date(i.expires_at).toLocaleString()}`}
              </Text>
              {!i.revoked_at && (
                <Action
                  title="招待を無効化"
                  disabled={busy}
                  onPress={() => void revoke(i.id)}
                />
              )}
            </View>
          ))}
          {more && (
            <Action
              title="続きを表示"
              disabled={busy}
              onPress={() => void next()}
            />
          )}
        </>
      )}
    </Page>
  );
}
