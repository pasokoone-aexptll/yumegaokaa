import { router } from "expo-router";
import { Text, View } from "react-native";
import {
  DetailPage,
  DetailRow,
  Section,
  detail,
} from "../../components/DetailUI";
import { useProfile } from "../../hooks/useProfile";
export default function Settings() {
  const { profile, status } = useProfile();
  return (
    <DetailPage title="アカウント" root>
      <Section>
        <View style={{ padding: 20, gap: 6 }}>
          <Text style={{ fontSize: 24, fontWeight: "700" }}>
            {profile?.display_name ?? "プロフィール"}
          </Text>
          {!!status && <Text style={detail.secondary}>{status}</Text>}
        </View>
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
      <Section>
        <DetailRow
          icon="construct-outline"
          title="運営"
          onPress={() => router.push("/admin")}
        />
      </Section>
    </DetailPage>
  );
}
