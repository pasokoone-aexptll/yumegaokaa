import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { DetailPage } from "../components/DetailUI";
import { NativeAction } from "../components/denshin/NativeAction";
import { SuperAsset } from "../components/icons/SuperAsset";
import { Avatar } from "../components/Avatar";
import { useBlocks } from "../hooks/useBlocks";
export default function Blocks() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [query, setQuery] = useState("");
  const data = useBlocks(name);
  const search = () => {
    if (query.trim())
      router.push({
        pathname: "/settings/blocks",
        params: { name: query.trim() },
      });
  };
  return (
    <DetailPage
      title="Block settings"
      refreshing={data.loading}
      onRefresh={data.refresh}
    >
      {!!data.error && <Text accessibilityRole="alert">{data.error}</Text>}
      {data.loading ? (
        <ActivityIndicator />
      ) : data.items.length === 0 ? (
        <View style={{ alignItems: "center", gap: 40, paddingTop: 70 }}>
          <SuperAsset name="非常口から人が出る" width={210} height={240} />
          <Text
            style={{
              fontFamily: "ui-rounded",
              color: "rgba(0,0,0,0.2)",
              fontSize: 17,
            }}
          >
            {name
              ? "この名前のユーザーは見つかりませんでした"
              : "ブロックしている人はいません"}
          </Text>
        </View>
      ) : (
        data.items.map((user) => (
          <View
            key={user.account_id}
            style={
              name
                ? { alignItems: "center", gap: 22, paddingVertical: 50 }
                : {
                    backgroundColor: "white",
                    borderRadius: 25,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }
            }
          >
            <Avatar
              shape="square"
              path={user.avatar_path}
              version={user.avatar_updated_at}
              name={user.display_name}
              size={name ? 135 : 48}
            />
            <Text
              style={{
                fontFamily: "ui-rounded",
                fontSize: name ? 28 : 20,
                fontWeight: "600",
                flex: name ? undefined : 1,
              }}
            >
              {name ? "@" : ""}
              {user.display_name}
            </Text>
            <View
              style={{ width: name ? "100%" : 80, marginTop: name ? 50 : 0 }}
            >
              <NativeAction
                title={name ? "ユーザーをブロック" : "解除"}
                destructive={!!name}
                disabled={data.busy}
                onPress={() => {
                  void data.update(user.account_id, !!name).then((ok) => {
                    if (ok && name) router.back();
                  });
                }}
              />
            </View>
          </View>
        ))
      )}
      {!name && (
        <>
          <View style={{ flex: 1, minHeight: 40 }} />
          <TextInput
            accessibilityLabel="ブロックするユーザー名"
            value={query}
            onChangeText={setQuery}
            placeholder="ブロックするユーザー名を入力"
            clearButtonMode="while-editing"
            returnKeyType="search"
            onSubmitEditing={search}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: "white",
              borderRadius: 30,
              padding: 18,
              fontFamily: "ui-rounded",
              fontSize: 17,
            }}
          />
          {!!query.trim() && (
            <NativeAction tone="blue" title="ユーザーを確認" onPress={search} />
          )}
          <Text
            style={{
              color: "rgba(0,0,0,0.25)",
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            ブロックすると相手のチャット・入街ログ・募集を表示しません。街の人数や匿名の気配は変わりません。
          </Text>
        </>
      )}
    </DetailPage>
  );
}
