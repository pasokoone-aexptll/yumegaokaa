import { router } from "expo-router";
import { Action, Page } from "../../components/Page";
export default function Settings() {
  return (
    <Page title="アカウント">
      <Action title="プロフィール" onPress={() => router.push("/profile")} />
      <Action title="友人を招待" onPress={() => router.push("/invitations")} />
      <Action title="お知らせ" onPress={() => router.push("/notifications")} />
      <Action title="ブロック設定" onPress={() => router.push("/blocks")} />
      <Action title="運営" onPress={() => router.push("/admin")} />
      <Action title="ログイン・接続状態" onPress={() => router.navigate("/")} />
    </Page>
  );
}
