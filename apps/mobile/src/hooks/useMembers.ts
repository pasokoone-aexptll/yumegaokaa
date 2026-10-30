import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
import type { Member } from "../lib/member";

export function useMembers() {
  const [items, setItems] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const current = useRef<Member[]>([]);
  const generation = useRef(0);
  const loading = useRef(false);

  const load = useCallback(async (append = false) => {
    if (append && loading.current) return;
    loading.current = true;
    const request = ++generation.current;
    setBusy(true);
    setError("");
    try {
      // Refresh every loaded page, so editing a member beyond page one keeps
      // that member available. A new snapshot replaces the list atomically.
      const target = append
        ? 1
        : Math.max(1, Math.ceil(current.current.length / 100));
      let next = append ? [...current.current] : [];
      let hasMore = false;
      for (let page = 0; page < target; page++) {
        const after = next.at(-1)?.account_id;
        const result = await native.rpc<{ items: Member[] }>(
          "operator_members",
          after ? { after } : {},
        );
        if (request !== generation.current) return;
        const ids = new Set(next.map((member) => member.account_id));
        next = [
          ...next,
          ...result.items.filter((member) => !ids.has(member.account_id)),
        ];
        hasMore = result.items.length === 100;
        if (!hasMore) break;
      }
      current.current = next;
      setItems(next);
      setMore(hasMore);
    } catch {
      if (request !== generation.current) return;
      current.current = [];
      setItems([]);
      setMore(false);
      setError("一覧を更新できません。追加認証と通信を確認してください。");
    } finally {
      if (request === generation.current) {
        loading.current = false;
        setBusy(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current++;
        loading.current = false;
        current.current = [];
        setItems([]);
      };
    }, [load]),
  );

  return {
    items,
    error,
    busy,
    more,
    refresh: () => load(),
    loadMore: () => load(true),
  };
}
