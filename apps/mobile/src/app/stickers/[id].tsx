import { LocationPicker } from "../../components/LocationPicker";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Modal, Text, TextInput } from "react-native";
import { Action, Empty, Page, ui } from "../../components/Page";
import { localStickerAdapter } from "../../lib/stickers";
import { useStickerDetail } from "../../hooks/useStickerDetail";
export default function Sticker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    draft,
    busy,
    error,
    editing,
    setEditing,
    title,
    setTitle,
    point,
    setPoint,
    selecting,
    setSelecting,
    load,
    step,
    save,
    cancel,
  } = useStickerDetail(id);
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
            <>
              <Empty>
                {draft.phase === "installed" ? "公開待ち" : "公開済み"}
              </Empty>
              <Action
                title={
                  draft.phase === "installed"
                    ? "街の範囲を確認して公開"
                    : "街の範囲・移設・停止"
                }
                onPress={() => router.push("/stickers/area")}
              />
            </>
          )}
        </>
      )}
    </Page>
  );
}
