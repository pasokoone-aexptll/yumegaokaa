import { Alert } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { RegistrationDeclarationForm } from "../components/onboarding/RegistrationDeclarationForm";

export default function ConsentPreview() {
  const router = useRouter();
  if (process.env.EXPO_PUBLIC_FIELD_TRIAL !== "1") return <Redirect href="/" />;
  return (
    <RegistrationDeclarationForm
      onClosePreview={() => router.back()}
      onWithdraw={() => Alert.alert("プレビュー", "退会は実行しません。")}
      onContinue={() =>
        Alert.alert(
          "プレビュー",
          "同意は保存していません。既存の記録も変更していません。",
        )
      }
    />
  );
}
