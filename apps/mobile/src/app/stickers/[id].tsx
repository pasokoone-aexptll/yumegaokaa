import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Alert, Text } from "react-native";
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
        "完了していません。通信・ステッカーを確認し、状態を再取得してください。",
      );
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
