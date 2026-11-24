import { useContext } from "react";
import { useRouter } from "expo-router";
import { RegistrationDeclarationForm } from "../components/onboarding/RegistrationDeclarationForm";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import { native } from "../lib/native";

export default function Consent() {
  const access = useContext(AccountAccessContext);
  const router = useRouter();
  return <RegistrationDeclarationForm onWithdraw={() => router.push("/withdraw")} onContinue={async (declaration) => {
    await native.rpc("consent_accept", declaration);
    access.retry();

  }} />;
}
