import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeToggle } from "../denshin/NativeToggle";
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
  onWithdraw,
}: {
  onWithdraw?: () => void;
  onContinue: (value: RegistrationDeclaration) => void | Promise<void>;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
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
  const declaration = registrationDeclaration(
    band,
    checked,
    policy,
    termsAccepted,
  );
  function open(url?: string) {
    if (url?.startsWith("https://"))
      void Linking.openURL(url).catch(() =>
        setError("ページを開けませんでした。"),
      );
  }
  function submit() {
    if (!declaration || busy) return;
    setBusy(true);
    setError("");
    void Promise.resolve()
      .then(() => onContinue(declaration))
      .catch(() =>
        setError(
          "保存できませんでした。通信状態を確認し、再度お試しください。",
        ),
      )
      .finally(() => setBusy(false));
  }
  function logout() {
    void native.logout().catch(() => setError("ログアウトできませんでした。"));
  }
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            年齢の確認
          </Text>
          <Text style={styles.caption}>
            年齢情報は他の利用者には表示しません。
          </Text>
        </View>
        <View style={styles.ageSection}>
          <View style={styles.group}>
            {(
              [
                ["under_13", "13 歳未満"],
                ["13_17", "13～17 歳"],
                ["18_plus", "18 歳以上"],
              ] as const
            ).map(([value, label], index) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: band === value,
                  disabled: busy,
                }}
                disabled={busy}
                onPress={() => {
                  setBand(value);
                  setChecked(false);
                }}
                style={[styles.row, index > 0 && styles.separator]}
              >
                <Text style={styles.age}>{label}</Text>
                {band === value && <Text style={styles.check}>✓</Text>}
              </Pressable>
            ))}
          </View>
          {band === "under_13" && (
            <Text accessibilityRole="alert" style={styles.error}>
              13歳未満の方は利用できません。
            </Text>
          )}
          <Text style={styles.disclosure}>
            プロフィール画像や投稿は登録済みの利用者に公開されます。{"\n"}
            入街中は背景でも位置情報を利用します。{"\n"}
            成人を含む他の利用者と現地で合流できるサービスです。
          </Text>
        </View>
        <View style={styles.bottom}>
          {policy?.available && (
            <View style={styles.group}>
              {[
                ["利用規約を読む", policy.terms_url],
                ["プライバシーポリシーを読む", policy.privacy_url],
              ].map(([label, url], index) => (
                <Pressable
                  key={label}
                  accessibilityRole="link"
                  onPress={() => open(url)}
                  style={[styles.row, index > 0 && styles.separator]}
                >
                  <Text style={styles.link}>{label}</Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
          {band === "13_17" && (
            <View style={styles.toggleRow}>
              <NativeToggle
                value={checked}
                disabled={busy}
                onValueChange={setChecked}
                accessibilityLabel="保護者の同意を得ています"
              />
              <Text style={styles.toggleText}>
                親権者などの保護者に利用規約とプライバシーポリシーを確認してもらい、利用の同意を得ています。
              </Text>
            </View>
          )}
          <View style={styles.toggleRow}>
            <NativeToggle
              value={termsAccepted}
              disabled={busy}
              onValueChange={setTermsAccepted}
              accessibilityLabel="利用規約に同意し、プライバシーポリシーを確認しました"
            />
            <Text style={styles.toggleText}>
              利用規約に同意し、プライバシーポリシーを確認しました。
            </Text>
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          {(!policy?.available || !!error) && (
            <NativeAction
              title="再読み込み"
              onPress={() => {
                setError("");
                setTermsAccepted(false);
                setPolicy(undefined);
                setAttempt(attempt + 1);
              }}
            />
          )}
          <View style={styles.actions}>
            <View style={styles.action}>
              <NativeAction
                title={busy ? "保存中…" : "同意して次へ"}
                tone="blue"
                contentWidth={100}
                disabled={!declaration || busy}
                onPress={submit}
              />
            </View>
            <View style={styles.action}>
              <NativeAction
                title={onWithdraw ? "同意せず退会" : "ログアウト"}
                tone="blue"
                contentWidth={100}
                disabled={busy}
                onPress={onWithdraw ?? logout}
              />
            </View>
          </View>
          {onWithdraw && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={logout}
              style={styles.logout}
            >
              <Text style={styles.caption}>ログアウト</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f5f5" },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 16,
  },
  heading: { alignItems: "center", gap: 12 },
  title: { fontSize: 20, fontWeight: "700", color: "#000" },
  caption: { fontSize: 14, color: "#999", textAlign: "center" },
  ageSection: { marginTop: 96 },
  group: {
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  row: {
    minHeight: 46,
    paddingHorizontal: 4,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e8e8e8",
  },
  age: { flex: 1, fontSize: 18, fontWeight: "600", color: "#000" },
  check: { fontSize: 24, color: "#aaa" },
  disclosure: { fontSize: 14, lineHeight: 19, color: "#999", marginTop: 26 },
  bottom: { flexGrow: 1, justifyContent: "flex-end", gap: 16, paddingTop: 56 },
  link: { flex: 1, fontSize: 17, color: "#888" },
  chevron: { fontSize: 30, lineHeight: 30, color: "#c8c8c8" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  toggleText: { flex: 1, fontSize: 14, lineHeight: 19, color: "#000" },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 8,
  },
  action: { flex: 1, minWidth: 132 },
  logout: { alignSelf: "center", padding: 10 },
  error: { color: "#b3261e", fontSize: 14, marginTop: 10 },
});
