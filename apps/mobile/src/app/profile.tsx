import { Text, TextInput } from "react-native";
import { Action, Page, ui } from "../components/Page";
import { Avatar } from "../components/Avatar";
import { useProfile } from "../hooks/useProfile";
export default function Profile() {
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
        title="保存"
        disabled={busy || !name.trim()}
        onPress={() => void save()}
      />
      {!!status && <Text>{status}</Text>}
    </Page>
  );
}
