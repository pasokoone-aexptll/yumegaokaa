import { Avatar } from "../components/Avatar";
import { imagePaths } from "../lib/imageReport";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text, TextInput } from "react-native";
import {
  DetailPage as Page,
  PrimaryAction as Action,
  DetailRow,
  Section,
  detail as ui,
} from "../components/DetailUI";
import { native } from "../lib/native";
export default function Report() {
  const router = useRouter();
  const {
    kind,
    id,
    images = "",
  } = useLocalSearchParams<{ kind: string; id?: string; images?: string }>();
  const isImage = kind === "profile_image" || kind === "street_image";
  const paths =
    isImage && typeof images === "string" ? imagePaths(kind, images) : [];
  const [choice, setChoice] = useState("");
  const path =
    paths.length === 1 ? paths[0] : paths.find((entry) => entry === choice);
  const bucket = kind === "profile_image" ? "avatars" : "street-icons";
  const [reason, setReason] = useState("spam"),
    [description, setDescription] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  async function send() {
    setBusy(true);
    setError("");
    try {
      await native.rpc("report_create", {
        target_kind: kind,
        ...(isImage ? { path } : { target_id: id }),
        reason,
        description,
      });
      setSent(true);
    } catch {
      setError("送信できませんでした。通信と対象の状態を確認してください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="通報">
      {sent ? (
        <>
          <Text style={ui.body}>
            通報を受け付けました。通報者の情報は相手に公開されません。
          </Text>
          <Action title="戻る" onPress={() => router.back()} />
        </>
      ) : (
        <>
          {isImage && (
            <Section
              title={
                kind === "street_image"
                  ? "通報する街のアイコン"
                  : "通報するプロフィール画像"
              }
            >
              {paths.map((item, index) => (
                <DetailRow
                  key={item}
                  title={
                    paths.length === 1 ? "対象の画像" : `画像 ${index + 1}`
                  }
                  leading={
                    <Avatar bucket={bucket} path={item} name="" size={60} />
                  }
                  selected={item === path}
                  disabled={busy}
                  onPress={() => setChoice(item)}
                />
              ))}
              {!paths.length && (
                <Text style={ui.error}>対象の画像を確認できません。</Text>
              )}
            </Section>
          )}
          <Section title="通報する理由">
            {[
              ["spam", "スパム"],
              ["harassment", "迷惑行為"],
              ["other", "その他"],
            ].map(([value, label]) => (
              <DetailRow
                key={value}
                selected={reason === value}
                disabled={busy}
                title={label}
                onPress={() => setReason(value)}
              />
            ))}
          </Section>
          <Text style={ui.secondary}>通報者の情報は相手に公開されません。</Text>
          <TextInput
            style={[ui.input, { minHeight: 120, textAlignVertical: "top" }]}
            editable={!busy}
            placeholder="説明（任意）"
            multiline
            maxLength={1000}
            value={description}
            onChangeText={setDescription}
          />
          {!!error && <Text style={ui.error}>{error}</Text>}
          <Action
            title="運営へ送信"
            disabled={busy || (isImage && !path)}
            onPress={send}
          />
        </>
      )}
    </Page>
  );
}