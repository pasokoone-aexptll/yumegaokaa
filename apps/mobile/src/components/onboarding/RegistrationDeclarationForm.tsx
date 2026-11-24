import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { DetailPage } from "../DetailUI";
import { NativeAction } from "../denshin/NativeAction";
import { native } from "../../lib/native";
import {
  registrationDeclaration,
  type AgeBand,
  type RegistrationDeclaration,
  type RegistrationPolicy,
} from "../../lib/registrationDeclaration";

export function RegistrationDeclarationForm({
  onContinue,
}: {
  onContinue: (value: RegistrationDeclaration) => void;
}) {
  const [band, setBand] = useState<AgeBand>();
  const [checked, setChecked] = useState(false);
  const [policy, setPolicy] = useState<RegistrationPolicy>();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    native
      .rpc<RegistrationPolicy>("registration_policy", {})
      .then((value) => {
        if (active) {
          setPolicy(value);
          if (!value.available) setError("登録の案内を準備中です。");
        }
      })
      .catch(() => {
        if (active) setError("登録の案内を取得できませんでした。");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const declaration = registrationDeclaration(band, checked, policy);
  function open(url?: string) {
    if (url?.startsWith("https://"))
      void Linking.openURL(url).catch(() =>
        setError("ページを開けませんでした。"),
      );
  }
  return (
    <DetailPage title="年齢の確認" root>
      <View style={{ padding: 24, gap: 20 }}>
        <Text>年齢の区分を選んでください。他の利用者には表示しません。</Text>
        {(
          [
            ["under_13", "13歳未満"],
            ["13_17", "13〜17歳"],
            ["18_plus", "18歳以上"],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: band === value }}
            onPress={() => {
              setBand(value);
              setChecked(false);
            }}
            style={{ paddingVertical: 14 }}
          >
            <Text>
              {band === value ? "●" : "○"} {label}
            </Text>
          </Pressable>
        ))}
        {band === "under_13" && (
          <Text accessibilityRole="alert">13歳未満の方は利用できません。</Text>
        )}
        <Text>
          プロフィール画像や投稿は登録済みの利用者に公開されます。入街中は背景でも位置情報を利用します。成人を含む他の利用者と現地で合流できるサービスです。
        </Text>
        {policy?.available && (
          <View style={{ gap: 16 }}>
            <Pressable
              accessibilityRole="link"
              onPress={() => open(policy.terms_url)}
            >
              <Text>利用規約を読む</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => open(policy.privacy_url)}
            >
              <Text>プライバシーポリシーを読む</Text>
            </Pressable>
          </View>
        )}
        {band === "13_17" && (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => setChecked(!checked)}
            style={{ paddingVertical: 14 }}
          >
            <Text>
              {checked ? "☑" : "☐"}{" "}
              親権者などの保護者に利用規約とプライバシーポリシーを確認してもらい、利用の同意を得ています。
            </Text>
          </Pressable>
        )}
        {!!error && <Text accessibilityRole="alert">{error}</Text>}
        {!policy?.available && (
          <NativeAction
            title="再読み込み"
            onPress={() => {
              setError("");
              setPolicy(undefined);
              setAttempt(attempt + 1);
            }}
          />
        )}
        <NativeAction
          title="次へ"
          disabled={!declaration}
          onPress={() => {
            if (declaration) onContinue(declaration);
          }}
        />
        <NativeAction
          title="ログアウト"
          onPress={() => {
            void native
              .logout()
              .catch(() => setError("ログアウトできませんでした。"));
          }}
        />
      </View>
    </DetailPage>
  );
}
