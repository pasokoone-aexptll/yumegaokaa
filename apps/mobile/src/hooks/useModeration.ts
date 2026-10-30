import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { native } from "../lib/native";
import { streetChanges } from "../lib/streetChanges";

type Report = {
  id: string;
  target_kind: string;
  target_id: string;
  reason: string;
  description: string;
  evidence: { body?: string; title?: string; description?: string };
  created_at: string;
  review_due: boolean;
};

export function useModeration() {
  const [items, setItems] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const request = useRef(0);
  const writing = useRef(false);

  const load = useCallback(async () => {
    const gen = generation.current;
    const seq = ++request.current;
    setLoading(true);
    try {
      const result = await native.rpc<{ items: Report[] }>(
        "operator_reports",
        {},
      );
      if (gen !== generation.current || seq !== request.current) return;
      setItems(result.items);
      setError("");
    } catch {
      if (gen !== generation.current || seq !== request.current) return;
      setItems([]);
      setError("通報を取得できません。接続と運営認証を確認してください。");
    } finally {
      if (gen === generation.current && seq === request.current)
        setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      generation.current++;
      void load();
      return () => {
        generation.current++;
        request.current++;
        setItems([]);
        setError("");
      };
    }, [load]),
  );

  async function act(
    operation: "operator_message_delete" | "operator_report_resolve",
    id: string,
    resolution?: "handled" | "no_action",
  ) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    request.current++;
    const gen = generation.current;
    try {
      await native.rpc(operation, { id, resolution });
      streetChanges.notify();
      if (gen === generation.current) await load();
    } catch {
      if (gen !== generation.current) return;
      // A lost response may still mean the operation committed.
      await load();
      if (gen === generation.current)
        setError(
          "操作結果を確認できませんでした。最新の一覧を確認してください。",
        );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  return { items, error, busy, loading, load, act };
}
