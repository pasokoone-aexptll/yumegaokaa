import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { reviewEnabled } from "../components/debug/reviewEnabled";
import { ReviewAvatars } from "../components/debug/ReviewAvatars";
import { StreetLogin } from "../components/StreetLogin";
import {
  ReceiveInvitation,
  InvitationChecking,
} from "../components/onboarding/ReceiveInvitation";
import { ProfileSetup } from "../components/onboarding/ProfileSetup";
import { WelcomeView } from "./welcome";
const stages = [
  "auth",
  "invite",
  "checking",
  "name",
  "photo",
  "pool",
  "welcome",
] as const;
type Stage = (typeof stages)[number];
export default function OnboardingReview() {
  return reviewEnabled ? (
    <ReviewAvatars>
      <Scenes />
    </ReviewAvatars>
  ) : null;
}
function Scenes() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stage?: string }>();
  const initialStage = stages.includes(params.stage as Stage)
    ? (params.stage as Stage)
    : "auth";
  const [stage, setStage] = useState<Stage>(initialStage);
  useEffect(() => {
    setStage(initialStage);
  }, [initialStage]);
  const [email, setEmail] = useState("review@example.test"),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false),
    [name, setName] = useState("sannlib");
  const [nextSendAt, setNextSendAt] = useState(0);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    if (stage !== "checking") return;
    const t = setTimeout(() => setStage("name"), 2400);
    return () => clearTimeout(t);
  }, [stage]);
  async function login(resend = false, createAccount = true) {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    if (!live.current) return;
    if (!sent || resend) {
      setNextSendAt(Date.now() + 60000);
      setSent(true);
      setCode("");
      setBusy(false);
      return;
    }
    setSuccess(true);
    await new Promise((r) => setTimeout(r, 1100));
    if (!live.current) return;
    setBusy(false);
    setStage(createAccount ? "invite" : "welcome");
  }
  return (
    <View style={{ flex: 1 }}>
      {stage === "auth" ? (
        <StreetLogin
          {...{
            email,
            setEmail,
            code,
            setCode,
            sent,
            setSent,
            error,
            setError,
            busy,
            login,
          }}
          nextSendAt={nextSendAt}
          authSuccess={success}
        />
      ) : stage === "invite" ? (
        <ReceiveInvitation
          scanning={false}
          busy={false}
          status=""
          onScan={() => setStage("checking")}
          onCancel={() => {}}
          onCode={() => {}}
          onLogout={() => router.back()}
        />
      ) : stage === "checking" ? (
        <InvitationChecking />
      ) : stage === "welcome" ? (
        <WelcomeView name={name} onComplete={() => router.back()} />
      ) : (
        <ProfileSetup
          stage={stage}
          name={name}
          onName={setName}
          busy={false}
          onNext={() =>
            setStage(
              stage === "name"
                ? "photo"
                : stage === "photo"
                  ? "pool"
                  : "welcome",
            )
          }
        />
      )}
      <View
        style={{
          position: "absolute",
          top: 62,
          right: 8,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Pressable
          accessibilityLabel="オンボーディング確認を終了"
          onPress={() => router.back()}
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 10, color: "rgba(0,0,0,0.3)" }}>
            REVIEW CLOSE
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="確認の次の段階"
          onPress={() =>
            setStage(stages[(stages.indexOf(stage) + 1) % stages.length])
          }
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 10, color: "rgba(0,0,0,0.3)" }}>NEXT</Text>
        </Pressable>
      </View>
    </View>
  );
}
