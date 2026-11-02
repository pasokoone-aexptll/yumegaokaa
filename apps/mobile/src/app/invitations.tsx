import { Share, Text, TextInput, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { native } from "../lib/native";
import { useInvitations } from "../hooks/useInvitations";
export default function Invitations() {
  const {
    receiving,
    pending,
    items,
    code,
    setCode,
    issued,
    status,
    setStatus,
    busy,
    loading,
    refresh,
    act,
  } = useInvitations();
  return (
    <Page title={receiving ? "招待を受け取る" : "友人を招待"}>
      {!receiving && (
        <>
          <Text style={ui.muted}>
            招待は1回限り、7日間有効です。コードを公開の場所に載せないでください。
          </Text>
          <Action
            title={pending ? "前回の招待を確認" : "招待を発行"}
            disabled={busy}
            onPress={() => void act("invite_create")}
          />
          {!!issued && (
            <View style={ui.card}>
              <Text selectable>{issued.code}</Text>
              <Action
                title="コードを共有"
                onPress={() =>
                  void Share.share({
                    message: `夢ヶ丘の招待コード：${issued.code}（7日間・1回限り）`,
                  }).catch(() =>
                    setStatus("共有できませんでした。もう一度お試しください。"),
                  )
                }
              />
            </View>
          )}
        </>
      )}
      <TextInput
        style={ui.input}
        placeholder="受け取った招待コード"
        autoCapitalize="none"
        value={code}
        onChangeText={setCode}
      />
      <Action
        title="招待を受け取る"
        disabled={busy || !code.trim()}
        onPress={() => void act("invite_accept", { code })}
      />
      <Text>{status}</Text>
      {receiving && (
        <Action
          title="ログアウト"
          disabled={busy}
          onPress={() =>
            void native
              .logout()
              .catch(() => setStatus("ログアウトできませんでした。"))
          }
        />
      )}
      {!receiving && (
        <Action
          title="再読み込み"
          disabled={busy || loading}
          onPress={() => refresh()}
        />
      )}
      {loading && <Empty>読み込み中…</Empty>}
      {!receiving && !loading && !status && !items.length && (
        <Empty>発行した招待はありません。</Empty>
      )}
      {items.map((i) => (
        <View key={i.id} style={ui.card}>
          <Text>
            {i.used
              ? "使用済み"
              : i.revoked
                ? "停止済み"
                : i.expired
                  ? "期限切れ"
                  : `有効期限 ${new Date(i.expires_at).toLocaleDateString()}`}
          </Text>
          {!i.used && !i.revoked && !i.expired && (
            <Action
              title="この招待を停止"
              disabled={busy}
              onPress={() => void act("invite_revoke", { id: i.id })}
            />
          )}
        </View>
      ))}
    </Page>
  );
}
