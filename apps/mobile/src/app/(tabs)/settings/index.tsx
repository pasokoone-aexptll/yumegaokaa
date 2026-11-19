import { Alert, Text, View } from "react-native";
import { native } from "../../../lib/native";
import { SuperAsset } from "../../../components/icons/SuperAsset";
import { reviewEnabled } from "../../../components/debug/reviewEnabled";
import { AccountPage } from "../../../components/AccountPage";
import { useRouter } from "expo-router";
import { DetailRow, Section, detail } from "../../../components/DetailUI";
import { useProfile } from "../../../hooks/useProfile";
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
          title="Profile"
          onPress={() => router.push("/settings/profile")}
        />
        <DetailRow
          icon="images-outline"
          title="My city pool icon"
          onPress={() => router.push("/settings/street-icons")}
        />
      </Section>
      <Section>
        <DetailRow
          icon="person-add-outline"
          title="Invite friends to the app"
          onPress={() => router.push("/settings/invitations")}
        />
        <DetailRow
          icon="hand-left-outline"
          title="Block settings"
          onPress={() => router.push("/settings/blocks")}
        />
      </Section>
      <Section>
        <DetailRow
          icon="shield-checkmark-outline"
          title="Account settings"
          onPress={() => router.push("/settings/account")}
        />
        <DetailRow
          icon="construct-outline"
          title="運営"
          onPress={() => router.push("/settings/admin")}
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
      {reviewEnabled && (
        <DetailRow
          title="Simulator視覚確認"
          onPress={() => router.push("/settings/review")}
        />
      )}
      <View style={{ marginTop: -6 }}>
        <Section>
          <DetailRow
            title="Logout"
            leading={<SuperAsset name="logout" size={30} />}
            onPress={() =>
              Alert.alert("ログアウトしますか？", "", [
                { text: "戻る", style: "cancel" },
                {
                  text: "ログアウト",
                  onPress: () => {
                    void native
                      .logout()
                      .catch(() => Alert.alert("ログアウトできませんでした"));
                  },
                },
              ])
            }
          />
        </Section>
      </View>
    </AccountPage>
  );
}
