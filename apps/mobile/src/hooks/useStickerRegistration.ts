import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { native, streetID } from "../lib/native";
import {
  submitCommand,
  pendingCommand,
  cancelPendingCommand,
} from "../lib/commands";
import { StickerDraft } from "../lib/stickers";
export function useStickerRegistration() {
  const [items, setItems] = useState<StickerDraft[]>([]),
    [title, setTitle] = useState(""),
    [point, setPoint] = useState<[number, number]>(),
    [selecting, setSelecting] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [pending, setPending] = useState<Record<string, unknown> | null>(null);
  const load = useCallback(async () => {
    try {
      const saved = await pendingCommand("sticker_create");
      setPending(saved?.body ?? null);
      if (saved) {
        setTitle(String(saved.body.title ?? ""));
        setPoint([Number(saved.body.longitude), Number(saved.body.latitude)]);
      }
      const r = await native.rpc<{ items: StickerDraft[] }>("sticker_list", {
        street_id: streetID,
      });
      setItems(r.items);
      setError("");
    } catch {
      setError("運営の追加認証と通信を確認してください。");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function create() {
    if (!point) return;
    setBusy(true);
    try {
      const r = await submitCommand<{ id: string }>(
        "sticker_create",
        pending ?? {
          street_id: streetID,
          title: title.trim(),
          longitude: point[0],
          latitude: point[1],
        },
      );
      setPending(null);
      setTitle("");
      setPoint(undefined);
      router.push({ pathname: "/stickers/[id]", params: { id: r.id } });
    } catch {
      await load();
      setError("登録結果を確認できません。保存した内容で再試行できます。");
    } finally {
      setBusy(false);
    }
  }
  async function cancelPending() {
    setBusy(true);
    try {
      const result = await cancelPendingCommand<{ id: string }>(
        "sticker_create",
      );
      setPending(null);
      if (result)
        router.push({ pathname: "/stickers/[id]", params: { id: result.id } });
      else {
        setTitle("");
        setPoint(undefined);
      }
      await load();
    } catch {
      setError("取消結果を確認できません。通信を確認して再試行してください。");
    } finally {
      setBusy(false);
    }
  }
  return {
    items,
    title,
    setTitle,
    point,
    setPoint,
    selecting,
    setSelecting,
    busy,
    error,
    pending,
    create,
    cancelPending,
  };
}
