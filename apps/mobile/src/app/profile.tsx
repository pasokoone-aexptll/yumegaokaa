import { native } from "../lib/native";
import { useContext, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../components/Avatar";
import { useProfile } from "../hooks/useProfile";
import { NativeIconButton } from "../components/denshin/NativeIconButton";
import { SuperAsset } from "../components/icons/SuperAsset";
import { NativeAction } from "../components/denshin/NativeAction";
export default function Profile() {
  const [logoutError, setLogoutError] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const access = useContext(AccountAccessContext);
  const onboarding = access.status === "profile_required";
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = onboarding || edit === "1";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, name, setName, status, busy, save, selectAvatar } =
    useProfile();
  const submit = async () => {
    if (await save()) {
      access.retry();
      if (!onboarding) router.back();
    }
  };
  if (onboarding)
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{
          padding: 28,
          paddingTop: insets.top + 45,
          flexGrow: 1,
          gap: 24,
        }}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <SuperAsset name="accountAtmark" size={60} />
        <Text style={{ fontFamily: "ui-rounded", fontSize: 26 }}>
          {nameSaved ? "プロフィール画像を選ぶ" : "名前を決める"}
        </Text>
        {nameSaved ? (
          <>
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Avatar
                shape="square"
                path={profile?.avatar_path}
                version={profile?.avatar_updated_at}
                name={name}
                size={140}
              />
            </View>
            <NativeAction
              title="画像を選ぶ"
              tone="blue"
              disabled={busy}
              onPress={() => void selectAvatar()}
            />
            <NativeAction
              title="次へ"
              tone="blue"
              disabled={busy}
              onPress={() => access.retry()}
            />
          </>
        ) : (
          <>
            <Text style={{ color: "rgba(0,0,0,0.5)", lineHeight: 22 }}>
              ユーザー名は街チャットや電信PINに表示されます。
            </Text>
            <TextInput
              accessibilityLabel="名前"
              value={name}
              onChangeText={setName}
              editable={!busy}
              maxLength={50}
              placeholder="名前"
              style={{
                fontFamily: "ui-rounded",
                fontSize: 18,
                backgroundColor: "rgba(0,0,0,0.04)",
                padding: 16,
                borderRadius: 24,
              }}
            />
            <NativeAction
              title="次へ"
              tone="blue"
              disabled={busy || !name.trim()}
              onPress={() => {
                void save().then((ok) => {
                  if (ok) setNameSaved(true);
                });
              }}
            />
          </>
        )}
        {!!status && <Text accessibilityRole="alert">{status}</Text>}
        <Image
          source={require("../../assets/superassets/DreamCloud背景.png")}
          style={{
            width: 240,
            height: 210,
            alignSelf: "flex-end",
            opacity: 0.4,
          }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }} />
        {!!logoutError && <Text accessibilityRole="alert">{logoutError}</Text>}
        <NativeAction
          title="ログアウト"
          disabled={busy}
          onPress={() => {
            void native
              .logout()
              .catch(() => setLogoutError("ログアウトできませんでした。"));
          }}
        />
      </ScrollView>
    );
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F6F6F6" }}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          height: 200,
          backgroundColor: "rgba(255,45,85,0.2)",
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {!onboarding ? (
          <NativeIconButton
            icon="chevron-base"
            rotation={180}
            dark={false}
            label="戻る"
            onPress={() => router.back()}
          />
        ) : (
          <View />
        )}
        <NativeIconButton
          icon={editing ? "check" : "edit"}
          dark={false}
          active={editing}
          disabled={busy || (editing && !name.trim())}
          label={editing ? "保存" : "編集"}
          onPress={() => {
            if (editing) void submit();
            else
              router.push({
                pathname: "/settings/profile",
                params: { edit: "1" },
              });
          }}
        />
      </View>
      <View
        style={{
          marginTop: -54,
          alignItems: "center",
          gap: 20,
          paddingHorizontal: 26,
        }}
      >
        <View
          style={{ borderRadius: 28, padding: 5, backgroundColor: "#F6F6F6" }}
        >
          <Avatar
            shape="square"
            path={profile?.avatar_path}
            version={profile?.avatar_updated_at}
            name={name}
            size={100}
          />
        </View>
        {editing ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy || !profile?.display_name}
            onPress={() => void selectAvatar()}
          >
            <Text
              style={{
                fontFamily: "ui-rounded",
                color: "#FF2D55",
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              Change Photo
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontWeight: "800",
              fontSize: 28,
            }}
          >
            @{name}
          </Text>
        )}
        {editing && (
          <View style={{ width: "100%", marginTop: 16 }}>
            <TextInput
              accessibilityLabel="名前"
              style={{
                fontFamily: "ui-rounded",
                fontSize: 18,
                paddingHorizontal: 24,
                height: 54,
                backgroundColor: "white",
                borderRadius: 30,
              }}
              placeholder="Enter your name"
              maxLength={50}
              value={name}
              onChangeText={setName}
              editable={!busy}
              clearButtonMode="while-editing"
            />
            <Text style={{ color: "rgba(0,0,0,0.2)", padding: 20 }}>
              Enter your name
            </Text>
          </View>
        )}
        {!!status && <Text accessibilityRole="alert">{status}</Text>}
        {!!logoutError && <Text accessibilityRole="alert">{logoutError}</Text>}
        {onboarding && (
          <>
            <NativeAction
              title="次へ"
              disabled={busy || !name.trim()}
              onPress={() => void submit()}
            />
            <NativeAction
              title="ログアウト"
              disabled={busy}
              onPress={() => {
                void native
                  .logout()
                  .catch(() => setLogoutError("ログアウトできませんでした。"));
              }}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}
