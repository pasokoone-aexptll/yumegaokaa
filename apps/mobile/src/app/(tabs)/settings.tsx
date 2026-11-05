import { AccountPage } from "../../components/AccountPage";
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { DetailRow, Section, detail } from "../../components/DetailUI";
import { useProfile } from "../../hooks/useProfile";
export default function Settings() {
  const router = useRouter();
  const { profile, status } = useProfile();
  return (
    <AccountPage
      name={profile?.display_name ?? "アカウント"}
      avatar={profile?.avatar_path}
      version={profile?.avatar_updated_at}
    >
      <Section>
        {!!status && (
          <Text style={[detail.secondary, { padding: 16 }]}>{status}</Text>
        )}
        <DetailRow
          icon="person-circle-outline"
          title="プロフィールを編集"
          onPress={() => router.push("/profile")}
        />
        <DetailRow
          icon="images-outline"
          title="街のアイコン"
          onPress={() => router.push("/street-icons")}
        />
      </Section>
      <Section title="街での交流">
        <DetailRow
          icon="person-add-outline"
          title="友人を招待"
          onPress={() => router.push("/invitations")}
        />
        <DetailRow
          icon="notifications-outline"
          title="お知らせ"
          onPress={() => router.push("/notifications")}
        />
        <DetailRow
          icon="hand-left-outline"
          title="ブロック設定"
          onPress={() => router.push("/blocks")}
        />
      </Section>
      <Section title="アカウントと接続">
        <DetailRow
          icon="shield-checkmark-outline"
          title="アカウント管理"
          onPress={() => router.push("/account")}
        />
        <DetailRow
          icon="wifi-outline"
          title="ログイン・接続状態"
          onPress={() =>
            router.navigate({ pathname: "/", params: { panel: "account" } })
          }
        />
      </Section>
      {__DEV__ && (
        <Section title="開発用">
          <DetailRow
            title="UIプレビュー"
            icon="construct-outline"
            onPress={() => router.push("/ui-preview")}
          />
        </Section>
      )}
      <Section>
        <DetailRow
          icon="construct-outline"
          title="運営"
          onPress={() => router.push("/admin")}
        />
      </Section>
      <Section title="アプリについて">
        <DetailRow
          title="ライセンス"
          onPress={() => router.push("/licenses")}
        />
      </Section>
    </AccountPage>
  );
}
