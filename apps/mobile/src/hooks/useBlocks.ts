import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
import { localBlocks } from "../lib/localBlocks";
export type BlockUser = {
  account_id: string;
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
};
export function useBlocks(name?: string) {
  const [items, setItems] = useState<BlockUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = generation.current;
    setLoading(true);
    try {
      const result = await native.rpc<{ items: BlockUser[] }>(
        name ? "block_lookup" : "block_list",
        name ? { name } : {},
      );
      if (current !== generation.current) return;
      setItems(result.items);
      setError("");
    } catch {
      if (current === generation.current)
        setError("取得できませんでした。接続を確認して再試行してください。");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [name]);
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      void refresh();
      return () => {
        generation.current++;
      };
    }, [refresh]),
  );
  const update = async (id: string, blocked: boolean) => {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    try {
      await native.rpc("block_set", { account_id: id, blocked });
      localBlocks.set(id, blocked);
      await refresh();
      return true;
    } catch {
      setError("変更を確認できませんでした。再試行してください。");
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  };
  return { items, error, loading, busy, refresh, update };
}
