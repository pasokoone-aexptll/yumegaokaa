import { native } from "../lib/native";
import { useContext, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import { ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileSetup } from "../components/onboarding/ProfileSetup";
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
      <ProfileSetup
        stage={nameSaved || profile?.display_name ? "photo" : "name"}
        name={name}
        onName={setName}
        busy={busy}
        error={logoutError || (status === "保存しました" ? undefined : status)}
        onExit={() => {
          void native
            .logout()
            .catch(() => setLogoutError("ログアウトできませんでした。"));
        }}
        onNext={() => {
          if (!nameSaved && !profile?.display_name)
            void save().then((ok) => {
              if (ok) setNameSaved(true);
            });
          else
            void selectAvatar().then((ok) => {
              if (ok) access.retry();
            });
        }}
      />
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
          paddingTop: insets.top,
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
          dark={editing}
          active={editing}
          accent="#C82DE0"
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
          marginTop: -53,
          alignItems: "center",
          gap: 20,
          paddingHorizontal: 26,
        }}
      >
        <View
          style={{ borderRadius: 26, padding: 4, backgroundColor: "#F6F6F6" }}
        >
          <Avatar
            shape="square"
            path={profile?.avatar_path}
            version={profile?.avatar_updated_at}
            name={name}
            size={96}
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
                color: "#FF3DA5",
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
          <View style={{ width: "100%", marginTop: 13 }}>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 30,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 24,
              }}
            >
              <TextInput
                accessibilityLabel="名前"
                style={{
                  fontFamily: "ui-rounded",
                  fontSize: 18,
                  fontWeight: "600",
                  flex: 1,
                  height: 54,
                  backgroundColor: "white",
                  borderRadius: 30,
                }}
                placeholder="Enter your name"
                maxLength={50}
                value={name}
                onChangeText={setName}
                editable={!busy}
              />
              {!!name && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="名前を消去"
                  disabled={busy}
                  onPress={() => setName("")}
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
                  <SuperAsset name="x" tint="white" size={11} />
                </Pressable>
              )}
            </View>
            <Text
              style={{
                color: "rgba(0,0,0,0.2)",
                paddingHorizontal: 20,
                paddingVertical: 10,
                fontFamily: "ui-rounded",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
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
