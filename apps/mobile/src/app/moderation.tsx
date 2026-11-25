import { useState } from "react";
import { Avatar } from "../components/Avatar";
import { useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { useModeration } from "../hooks/useModeration";

export default function Moderation() {
  const router = useRouter();
  const { items, error, busy, loading, load, act } = useModeration();
  return (
    <Page title="通報対応">
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action
        title="最新の通報を取得"
        disabled={busy || loading}
        onPress={() => void load()}
      />
      {loading && <Text style={ui.muted}>読み込み中…</Text>}
      {!loading && !items.length && !error && (
        <Empty>未対応の通報はありません。</Empty>
      )}
      {items.map((r) => (
        <View key={r.id} style={ui.card}>
          <Text>
            {(
              {
                profile_image: "プロフィール画像",
                street_image: "街のアイコン",
                message: "投稿",
                denshin: "電信PIN",
                recruitment: "募集",
                event: "オフ会",
              } as Record<string, string>
            )[r.target_kind] ?? r.target_kind}{" "}
            /{" "}
            {(
              {
                spam: "スパム",
                harassment: "迷惑行為",
                other: "その他",
              } as Record<string, string>
            )[r.reason] ?? r.reason}
            {r.review_due ? " · 整理対象" : ""}
          </Text>
          <Text>{r.description}</Text>
          {(r.target_kind === "profile_image" ||
            r.target_kind === "street_image") &&
            r.evidence.path &&
            (r.evidence.removed ? (
              <Text>画像を公開停止しました。</Text>
            ) : (
              <ImageRemoval
                path={r.evidence.path}
                bucket={
                  r.target_kind === "profile_image" ? "avatars" : "street-icons"
                }
                disabled={busy || loading}
                remove={() => void act("operator_image_delete", r.id)}
              />
            ))}
          <Text>{r.evidence.title}</Text>
          <Text>{r.evidence.body ?? r.evidence.description}</Text>
          {(r.target_kind === "event" || r.target_kind === "recruitment") && (
            <Action
              title={
                r.target_kind === "event"
                  ? "オフ会の詳細を確認"
                  : "募集の詳細を確認"
              }
              onPress={() =>
                router.push({
                  pathname:
                    r.target_kind === "event"
                      ? "/events/[id]"
                      : "/recruitments/[id]",
                  params: { id: r.target_id },
                })
              }
            />
          )}
          {(r.target_kind === "message" || r.target_kind === "denshin") && (
            <Action
              title={
                r.target_kind === "denshin" ? "電信PINを削除" : "元の投稿を削除"
              }
              disabled={busy || loading}
              onPress={() =>
                Alert.alert(
                  "投稿を削除しますか？",
                  r.target_kind === "denshin"
                    ? "PIN本文を削除し、募集と参加を終了します。通報証拠は保持方針に従って処理します。"
                    : "通常の本文は削除されます。通報証拠は保持方針に従って処理します。",
                  [
                    { text: "戻る", style: "cancel" },
                    {
                      text: "削除",
                      style: "destructive",
                      onPress: () =>
                        void act(
                          r.target_kind === "denshin"
                            ? "operator_denshin_delete"
                            : "operator_message_delete",
                          r.id,
                        ),
                    },
                  ],
                )
              }
            />
          )}
          <Action
            title="対応完了"
            disabled={busy || loading}
            onPress={() => void act("operator_report_resolve", r.id, "handled")}
          />
          <Action
            title="対応不要として完了"
            disabled={busy || loading}
            onPress={() =>
              void act("operator_report_resolve", r.id, "no_action")
            }
          />
        </View>
      ))}
    </Page>
  );
}

function ImageRemoval({
  path,
  bucket,
  disabled,
  remove,
}: {
  path: string;
  bucket: "avatars" | "street-icons";
  disabled: boolean;
  remove: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <Avatar
        key={attempt}
        path={path}
        bucket={bucket}
        name="通報された画像"
        size={150}
        onImageDisplay={() => setVisible(true)}
      />
      {visible ? (
        <Action
          title="この画像を削除"
          disabled={disabled}
          onPress={() =>
            Alert.alert(
              "通報された画像を削除しますか？",
              "この画像の公開を停止します。",
              [
                { text: "戻る", style: "cancel" },
                { text: "削除", style: "destructive", onPress: remove },
              ],
            )
          }
        />
      ) : (
        <Action
          title="画像を再読み込み"
          disabled={disabled}
          onPress={() => setAttempt(attempt + 1)}
        />
      )}
    </>
  );
}