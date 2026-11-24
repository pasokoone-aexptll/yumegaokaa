import { useRouter } from "expo-router";
import { Alert, Linking, Platform } from "react-native";
import androidNotices from "../legal/android-font-notices.json";
import { DetailPage, DetailRow, Section } from "../components/DetailUI";
import notices from "../legal/notices.json";

export default function Licenses() {
  const router = useRouter();
  const openDocument = (path: string) => {
    void Linking.openURL(`https://hello.dreamcloud.sh/${path}/`).catch(() => {
      Alert.alert(
        "ページを開けませんでした",
        "通信状態を確認して、もう一度お試しください。",
      );
    });
  };
  return (
    <DetailPage title="規約・プライバシーと謝辞">
      <Section title="電信出口">
        {process.env.EXPO_PUBLIC_FIELD_TRIAL === "1" && (
          <DetailRow
            title="年齢確認画面をプレビュー"
            onPress={() => router.push("/consent-preview")}
          />
        )}
        <DetailRow title="利用規約" onPress={() => openDocument("terms")} />
        <DetailRow
          title="プライバシーポリシー"
          onPress={() => openDocument("privacy")}
        />
        <DetailRow
          title="お問い合わせ・アカウント削除"
          onPress={() => openDocument("support")}
        />
      </Section>
      {[...notices, ...(Platform.OS === "android" ? androidNotices : [])].map(
        ({ title, text }) => (
          <Section key={title} title={title}>
            <DetailRow title={text.trimEnd()} />
          </Section>
        ),
      )}
    </DetailPage>
  );
}
