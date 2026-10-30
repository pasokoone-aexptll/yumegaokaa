import { native } from "../lib/native";
import { useContext, useState } from "react";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import { Text, TextInput } from "react-native";
import { Action, Page, ui } from "../components/Page";
import { Avatar } from "../components/Avatar";
import { useProfile } from "../hooks/useProfile";
export default function Profile() {
  const [logoutError, setLogoutError] = useState("");
  const access = useContext(AccountAccessContext);
  const onboarding = access.status === "profile_required";
  const { profile, name, setName, status, busy, save, selectAvatar } =
    useProfile();
  return (
    <Page title="プロフィール">
      <Avatar
        path={profile?.avatar_path}
        version={profile?.avatar_updated_at}
        name={name}
        size={88}
      />
      <Action
        title="写真を選ぶ"
        disabled={busy || !profile?.display_name}
        onPress={() => void selectAvatar()}
      />
      <TextInput
        style={ui.input}
        placeholder="表示名"
        maxLength={50}
        value={name}
        onChangeText={setName}
      />
      <Action
        title={onboarding ? "街を開く" : "保存"}
        disabled={busy || !name.trim()}
        onPress={() =>
          void (async () => {
            if (await save()) {
              access.retry();
            }
          })()
        }
      />
      {!!status && <Text>{status}</Text>}
      {!!logoutError && <Text style={ui.error}>{logoutError}</Text>}
      {onboarding && (
        <Action
          title="ログアウト"
          disabled={busy}
          onPress={() =>
            void native
              .logout()
              .catch(() => setLogoutError("ログアウトできませんでした。"))
          }
        />
      )}
    </Page>
  );
}
