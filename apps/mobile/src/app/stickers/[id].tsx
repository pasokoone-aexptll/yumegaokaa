import { LocationPicker } from "../../components/LocationPicker";
import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Alert, Modal, Text, TextInput } from "react-native";
import { Action, Empty, Page, ui } from "../../components/Page";
import { native } from "../../lib/native";
import {
  StickerDraft,
  stickerTouch,
  localStickerAdapter,
} from "../../lib/stickers";
export default function Sticker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState<StickerDraft>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [point, setPoint] = useState<[number, number]>();
  const [selecting, setSelecting] = useState(false);
  const load = useCallback(async () => {
    try {
      setDraft(await native.rpc<StickerDraft>("sticker_get", { id }));
      setError("");
    } catch {
      setError("登録を取得できません。認証と期限を確認してください。");
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function step() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const phase =
        draft.phase === "draft"
          ? "written"
          : draft.phase === "written"
            ? "verified"
            : "installed";
      const payload =
        phase === "installed"
          ? {}
          : {
              tag_payload: await stickerTouch(
                draft.tag_id,
                phase === "written",
              ),
            };
      setDraft(
        await native.rpc<StickerDraft>("sticker_step", {
          id,
          revision: draft.revision,
          phase,
          ...payload,
        }),
      );
    } catch {
      setError(
        "完了を確認できません。通信・ステッカーを確認し、状態を再取得してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!draft || !point) return;
    setBusy(true);
    try {
      setDraft(
        await native.rpc<StickerDraft>("sticker_edit", {
          id,
          revision: draft.revision,
          title: title.trim(),
          longitude: point[0],
          latitude: point[1],
        }),
      );
      setEditing(false);
      setError("");
    } catch {
      setError("変更を確認できません。状態を再取得してください。");
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    if (!draft) return;
    setBusy(true);
    try {
      await native.rpc("sticker_cancel", { id, revision: draft.revision });
      router.replace("/stickers");
    } catch {
      setError("取消を確認できません。状態を再取得してください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={draft?.title ?? "ステッカー"}>
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action
        title="状態を再取得"
        disabled={busy}
        onPress={() => void load()}
      />
      {draft && draft.phase !== "published" && (
        <>
          {editing ? (
            <>
              <TextInput
                style={ui.input}
                value={title}
                onChangeText={setTitle}
                maxLength={50}
                placeholder="管理名"
              />
              <Action
                title="設置場所を変更"
                disabled={busy}
                onPress={() => setSelecting(true)}
              />
              <Action
                title="変更を保存"
                disabled={busy || !title.trim() || !point}
                onPress={() => void save()}
              />
              <Action
                title="編集をやめる"
                disabled={busy}
                onPress={() => setEditing(false)}
              />
            </>
          ) : (
            <Action
              title="登録内容を編集"
              disabled={busy}
              onPress={() => {
                setTitle(draft.title);
                setPoint([draft.longitude, draft.latitude]);
                setEditing(true);
              }}
            />
          )}
          <Action
            title="この登録を取り消す"
            disabled={busy}
            onPress={() =>
              Alert.alert(
                "登録を取り消しますか？",
                "新規タグは使用できなくなります。移設中のタグは停止したままです。",
                [
                  { text: "戻る", style: "cancel" },
                  {
                    text: "取り消す",
                    style: "destructive",
                    onPress: () => void cancel(),
                  },
                ],
              )
            }
          />
        </>
      )}
      <Modal visible={selecting} onRequestClose={() => setSelecting(false)}>
        <LocationPicker
          initial={point}
          onCancel={() => setSelecting(false)}
          onConfirm={(p) => {
            setPoint(p);
            setSelecting(false);
          }}
        />
      </Modal>
      {draft && (
        <>
          {localStickerAdapter && (
            <Empty>開発用：NFCの書込・読取のみ代用します。</Empty>
          )}
          <Text>
            {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
          </Text>
          {["draft", "written", "verified"].includes(draft.phase) ? (
            <Action
              disabled={busy}
              title={
                draft.phase === "draft"
                  ? "書き込む"
                  : draft.phase === "written"
                    ? "再読取して照合"
                    : "現地への設置を確認"
              }
              onPress={() =>
                draft.phase === "draft"
                  ? Alert.alert("空のステッカーに書き込みます", undefined, [
                      { text: "戻る", style: "cancel" },
                      { text: "書き込む", onPress: () => void step() },
                    ])
                  : void step()
              }
            />
          ) : (
            <Empty>
              {draft.phase === "installed" ? "公開待ち" : "公開済み"}
            </Empty>
          )}
        </>
      )}
    </Page>
  );
}
