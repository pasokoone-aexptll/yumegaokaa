import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailPage, Section, DetailRow } from "../components/DetailUI";
import { useEmailChange } from "../hooks/useEmailChange";
import { NativeAction } from "../components/denshin/NativeAction";
import { CodeInput } from "../components/denshin/CodeInput";
import { SuperAsset } from "../components/icons/SuperAsset";
import { useAutoVerifyCode } from "../hooks/useAutoVerifyCode";
import { VerificationProgress } from "../components/denshin/VerificationProgress";
import { MapAsset } from "../components/map/MapAsset";
export default function Account() {
  const data = useEmailChange();
  return <AccountView data={data} />;
}
export function AccountView({
  data: a,
  editing,
}: {
  data: ReturnType<typeof useEmailChange>;
  editing?: string;
}) {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ edit?: string }>();
  const edit = editing ?? params.edit;
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
  const code = complete ? a.completedCode : isNew ? a.newCode : a.oldCode;
  useAutoVerifyCode({
    address,
    code,
    enabled: !!edit && !!a.pending && a.ready && !complete,
    busy: a.busy,
    verify: a.verify,
  });
  const inputStyle = {
    fontFamily: "ui-rounded",
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  } as const;
  return (
    <DetailPage
      bottomPadding={edit ? 16 : 4}
      title={edit ? "" : "Account settings"}
      refreshing={a.loading}
      onRefresh={a.load}
    >
      {edit ? (
        <View style={{ gap: complete || a.pending ? 24 : 32, paddingTop: 44 }}>
          <Text style={{ fontSize: 27, fontWeight: "600" }}>
            メールアドレスを変更
          </Text>
          {complete || a.pending ? (
            <>
              <Text
                style={{
                  color: "rgba(0,0,0,0.3)",
                  fontSize: 16,
                  lineHeight: 24,
                  marginTop: 16,
                }}
              >
                6-digit codeをメールに送信しました
              </Text>
              <CodeInput
                value={code}
                onChange={isNew ? a.setNewCode : a.setOldCode}
                disabled={complete || a.busy || !a.ready}
              />
              <View
                style={{
                  alignItems: "center",
                  marginTop: Math.max(100, height * 0.16),
                }}
              >
                <VerificationProgress complete={complete} busy={a.busy} />
              </View>
              {!complete && (
                <Text
                  style={{
                    color: "rgba(0,0,0,0.4)",
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  {address}
                  {"\n"}現在と新しいメールアドレスの両方で確認します。
                </Text>
              )}
              {!complete && a.verifiedAddress === "" && (
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
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 999,
                  height: 54,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  gap: 10,
                }}
              >
                <SuperAsset
                  name="atmark"
                  size={26}
                  tint="black"
                  opacity={0.3}
                />
                <TextInput
                  accessibilityLabel="新しいメールアドレス"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: "ui-rounded",
                    fontSize: 17,
                    color: "black",
                    paddingVertical: 0,
                  }}
                  value={a.next}
                  onChangeText={a.setNext}
                  placeholder="新しいメールアドレスを入力"
                  placeholderTextColor="rgba(0,0,0,0.18)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!a.busy && a.ready}
                  clearButtonMode="never"
                />
                {!!a.next && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="メールアドレスを消去"
                    disabled={a.busy}
                    onPress={() => a.setNext("")}
                    style={{
                      width: 28,
                      height: 28,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "rgba(0,0,0,0.22)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SuperAsset name="x" size={12} tint="white" />
                    </View>
                  </Pressable>
                )}
              </View>
              <View style={{ marginTop: Math.max(120, height * 0.3) }}>
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
          <View
            style={{
              marginTop: 20,
              minHeight: 54,
              backgroundColor: "white",
              borderRadius: 30,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <SuperAsset name="atmark" size={26} tint="black" opacity={0.3} />
            <Text selectable style={inputStyle}>
              {a.email || "読み込み中…"}
            </Text>
          </View>
          <View style={{ marginTop: -9 }}>
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
          </View>
          <View style={{ flex: 1, minHeight: 170 }} />
          <NativeAction
            title="アカウントを削除"
            destructive
            onPress={() => router.push("/withdraw")}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="データと謝辞・利用規約とプライバシー"
            onPress={() => router.push("/settings/licenses")}
            style={{
              alignItems: "center",
              gap: 8,
              marginTop: 46,
              paddingVertical: 8,
            }}
          >
            <View style={{ opacity: 0.08 }}>
              <MapAsset
                name="DreamCloud Logo"
                width={147}
                height={22}
                tint="black"
                fillOpacity={1}
              />
            </View>
            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                fontFamily: "ui-rounded",
                color: "rgba(0,0,0,0.14)",
              }}
            >
              データと謝辞・利用規約とプライバシー
            </Text>
          </Pressable>
        </>
      )}
      {a.busy && !a.pending && <ActivityIndicator />}
      {!!a.status && !complete && (
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
