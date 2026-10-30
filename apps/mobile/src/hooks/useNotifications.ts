import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
import { streetChanges } from "../lib/streetChanges";

export type Notice = {
  id: string;
  event_id: string;
  title: string;
  kind: "changed" | "canceled";
  created_at: string;
  read: boolean;
};

export function useNotifications() {
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<string | null>(null);
  const generation = useRef(0);
  const fetching = useRef(false);
  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    const gen = generation.current;
    try {
      const result = await native.rpc<{ items: Notice[] }>(
        "notification_list",
        {},
      );
      if (gen !== generation.current) return;
      setItems(result.items);
      setError("");
    } catch {
      if (gen === generation.current) setError("お知らせを取得できません。");
    } finally {
      fetching.current = false;
      if (gen === generation.current) setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      void load();
      const refresh = () => {
        if (AppState.currentState === "active") void load();
      };
      const timer = setInterval(refresh, 10000);
      const unsubscribe = streetChanges.subscribe(refresh);
      const foreground = AppState.addEventListener("change", refresh);
      return () => {
        generation.current++;
        clearInterval(timer);
        unsubscribe();
        foreground.remove();
      };
    }, [load]),
  );
  async function markRead(notice: Notice) {
    if (reading) return false;
    setReading(notice.id);
    const gen = generation.current;
    try {
      await native.rpc("notification_read", { id: notice.id });
      if (gen !== generation.current) return false;
      // Invalidate older list responses so they cannot undo the acknowledgement.
      generation.current++;
      setItems((previous) =>
        previous.map((n) => (n.id === notice.id ? { ...n, read: true } : n)),
      );
      setError("");
      return true;
    } catch {
      if (gen === generation.current) setError("確認を保存できませんでした。");
      return false;
    } finally {
      setReading(null);
    }
  }
  return { items, error, loading, reading, load, markRead };
}
