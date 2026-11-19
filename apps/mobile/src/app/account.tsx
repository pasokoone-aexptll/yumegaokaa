import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailPage, Section, DetailRow } from "../components/DetailUI";
import { useEmailChange } from "../hooks/useEmailChange";
import { NativeAction } from "../components/denshin/NativeAction";
import { CodeInput } from "../components/denshin/CodeInput";
import { SuperAsset } from "../components/icons/SuperAsset";
export default function Account() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const a = useEmailChange();
  const complete = a.status === "メールアドレスを変更しました";
  const address =
    a.verifiedAddress === a.email
      ? a.pending
      : a.verifiedAddress === a.pending
        ? a.email
        : edit === "new"
          ? a.pending
          : a.email;
  const isNew = address === a.pending;
  const code = isNew ? a.newCode : a.oldCode;
  const inputStyle = {
    fontFamily: "ui-rounded",
    backgroundColor: "white",
    borderRadius: 30,
    padding: 18,
    fontSize: 17,
  } as const;
  return (
    <DetailPage
      title={edit ? "" : "Account settings"}
      refreshing={a.loading}
      onRefresh={a.load}
    >
      {edit ? (
        <View style={{ gap: 30, paddingTop: 52 }}>
          <Text style={{ fontSize: 27, fontWeight: "600" }}>
            メールアドレスを変更
          </Text>
          {complete ? (
            <View style={{ alignItems: "center", paddingTop: 100 }}>
              <SuperAsset name="checkRounded" size={64} />
            </View>
          ) : a.pending ? (
            <>
              <Text style={{ color: "rgba(0,0,0,0.4)", lineHeight: 24 }}>
                {address} に送信された6桁のコードを入力してください。
              </Text>
              <CodeInput
                value={code}
                onChange={isNew ? a.setNewCode : a.setOldCode}
                disabled={a.busy || !a.ready}
              />
              <View style={{ marginTop: 80 }}>
                <NativeAction
                  tone="blue"
                  title="確認"
                  disabled={a.busy || !a.ready || code.length !== 6}
                  onPress={() => void a.verify(address, code)}
                />
              </View>
              <Text style={{ color: "rgba(0,0,0,0.4)", lineHeight: 22 }}>
                メール変更は、現在と新しいメールアドレスの両方で確認します。
              </Text>
              {a.verifiedAddress === "" && (
                <Pressable
                  onPress={() =>
                    router.setParams({ edit: isNew ? "old" : "new" })
                  }
                >
                  <Text
                    style={{ textAlign: "center", color: "rgba(0,0,0,0.5)" }}
                  >
                    もう一方のメールのコードを入力
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <TextInput
                accessibilityLabel="新しいメールアドレス"
                style={inputStyle}
                value={a.next}
                onChangeText={a.setNext}
                placeholder="新しいメールアドレスを入力"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!a.busy && a.ready}
                clearButtonMode="while-editing"
              />
              <View style={{ marginTop: 180 }}>
                <NativeAction
                  title="次へ"
                  tone="blue"
                  disabled={a.busy || !a.ready || !a.next.includes("@")}
                  onPress={() => void a.send()}
                />
              </View>
            </>
          )}
        </View>
      ) : (
        <>
          <View style={{ marginTop: 36 }}>
            <Text selectable style={inputStyle}>
              {a.email || "読み込み中…"}
            </Text>
          </View>
          <Section>
            <DetailRow
              title="メールアドレスを変更"
              leading={<SuperAsset name="accountAtmark" size={30} />}
              onPress={() =>
                router.push({
                  pathname: "/settings/account",
                  params: { edit: "1" },
                })
              }
            />
          </Section>
          <DetailRow
            title="ログイン・接続状態"
            onPress={() =>
              router.navigate({ pathname: "/", params: { panel: "account" } })
            }
          />
          <View style={{ flex: 1, minHeight: 170 }} />
          <NativeAction
            title="アカウントを削除"
            destructive
            onPress={() => router.push("/withdraw")}
          />
          <DetailRow
            title="データと謝辞・利用規約とプライバシー"
            onPress={() => router.push("/settings/licenses")}
          />
        </>
      )}
      {a.busy && <ActivityIndicator />}
      {!!a.status && (
        <Text
          accessibilityRole="alert"
          style={{ color: "rgba(0,0,0,0.55)", textAlign: "center" }}
        >
          {a.status}
        </Text>
      )}
    </DetailPage>
  );
}
