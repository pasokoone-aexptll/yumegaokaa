import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { DetailPage } from "../components/DetailUI";
import { NativeAction } from "../components/denshin/NativeAction";
import { SuperAsset } from "../components/icons/SuperAsset";
import { Avatar } from "../components/Avatar";
import { useBlocks } from "../hooks/useBlocks";
export default function Blocks() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const data = useBlocks(name);
  return <BlocksView data={data} name={name} />;
}
export function BlocksView({
  data,
  name,
}: {
  data: ReturnType<typeof useBlocks>;
  name?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const search = () => {
    if (query.trim())
      router.push({
        pathname: "/settings/blocks",
        params: { name: query.trim() },
      });
  };
  return (
    <DetailPage
      bottomPadding={16}
      title="Block settings"
      refreshing={data.loading}
      onRefresh={data.refresh}
    >
      {!!data.error && <Text accessibilityRole="alert">{data.error}</Text>}
      {data.loading ? (
        <ActivityIndicator />
      ) : data.items.length === 0 ? (
        <View style={{ alignItems: "center", gap: 20, paddingTop: 60 }}>
          <SuperAsset name="非常口から人が出る" width={280} height={335} />
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
                ? { alignItems: "center", gap: 14, paddingTop: 108 }
                : {
                    backgroundColor: "white",
                    borderRadius: 25,
                    padding: 14,
                    marginTop: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }
            }
          >
            <View
              style={
                name
                  ? {
                      padding: 9,
                      borderRadius: 40,
                      backgroundColor: "white",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.10)",
                    }
                  : undefined
              }
            >
              <Avatar
                shape="square"
                path={user.avatar_path}
                version={user.avatar_updated_at}
                name={user.display_name}
                size={name ? 126 : 48}
              />
            </View>
            <Text
              style={{
                fontFamily: "ui-rounded",
                fontSize: name ? 28 : 20,
                fontWeight: name ? "800" : "600",
                flex: name ? undefined : 1,
              }}
            >
              {name ? "@" : ""}
              {user.display_name}
            </Text>
            <View
              style={{ width: name ? "100%" : 66, marginTop: name ? 70 : 0 }}
            >
              <NativeAction
                compact={!name}
                contentWidth={name ? 156 : 40}
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
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 30,
              minHeight: 54,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <SuperAsset name="atmark" size={22} tint="black" opacity={0.3} />
            <TextInput
              accessibilityLabel="ブロックするユーザー名"
              value={query}
              onChangeText={setQuery}
              placeholder="ブロックするユーザー名を入力"
              placeholderTextColor="rgba(0,0,0,0.2)"
              returnKeyType="search"
              onSubmitEditing={search}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                minHeight: 54,
                color: "black",
                fontFamily: "ui-rounded",
                fontSize: 17,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ユーザー名を消去"
              onPress={() => setQuery("")}
              hitSlop={12}
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "rgba(0,0,0,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SuperAsset name="x" size={11} tint="white" />
            </Pressable>
          </View>
          <Text
            style={{
              color: "rgba(0,0,0,0.25)",
              textAlign: "center",
              fontFamily: "ui-rounded",
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            ブロックすると相手のチャット・入街ログ・募集を表示しません{"\n"}
            街の人数や匿名の気配は変わりません
          </Text>
        </>
      )}
    </DetailPage>
  );
}
