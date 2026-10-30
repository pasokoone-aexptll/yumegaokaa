import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { native } from "../lib/native";
import { StickerDraft, stickerTouch } from "../lib/stickers";
export function useStickerDetail(id: string) {
  const [draft, setDraft] = useState<StickerDraft>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [point, setPoint] = useState<[number, number]>();
  const [selecting, setSelecting] = useState(false);
  const generation = useRef(0);
  const request = useRef(0);
  const writing = useRef(false);
  const load = useCallback(async () => {
    const gen = generation.current;
    const seq = ++request.current;
    try {
      const result = await native.rpc<StickerDraft>("sticker_get", { id });
      if (gen !== generation.current || seq !== request.current) return;
      setDraft(result);
      setError("");
    } catch {
      if (gen !== generation.current || seq !== request.current) return;
      setDraft(undefined);
      setError("登録を取得できません。認証と期限を確認してください。");
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      setDraft(undefined);
      setEditing(false);
      setSelecting(false);
      void load();
      return () => {
        generation.current++;
        request.current++;
      };
    }, [load]),
  );
  async function step() {
    if (!draft || writing.current) return;
    writing.current = true;
    const gen = generation.current;
    request.current++;
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
      if (gen !== generation.current) return;
      const result = await native.rpc<StickerDraft>("sticker_step", {
        id,
        revision: draft.revision,
        phase,
        ...payload,
      });
      if (gen !== generation.current) return;
      setDraft(result);
    } catch {
      if (gen !== generation.current) return;
      setError(
        "完了を確認できません。通信・ステッカーを確認し、状態を再取得してください。",
      );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (!draft || !point || writing.current) return;
    writing.current = true;
    const gen = generation.current;
    request.current++;
    setBusy(true);
    try {
      if (gen !== generation.current) return;
      const result = await native.rpc<StickerDraft>("sticker_edit", {
        id,
        revision: draft.revision,
        title: title.trim(),
        longitude: point[0],
        latitude: point[1],
      });
      if (gen !== generation.current) return;
      setDraft(result);
      setEditing(false);
      setError("");
    } catch {
      if (gen !== generation.current) return;
      setError("変更を確認できません。状態を再取得してください。");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function cancel() {
    if (!draft || writing.current) return;
    writing.current = true;
    const gen = generation.current;
    request.current++;
    setBusy(true);
    try {
      await native.rpc("sticker_cancel", { id, revision: draft.revision });
      if (gen === generation.current) router.replace("/stickers");
    } catch {
      if (gen !== generation.current) return;
      setError("取消を確認できません。状態を再取得してください。");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return {
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
  };
}
