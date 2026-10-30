import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { native, streetID } from "../lib/native";
import { pendingCommand, submitCommand } from "../lib/commands";
export type Message = {
  id: string;
  author_id: string | null;
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
  body: string | null;
  created_at: string;
  deleted: boolean;
  kind: "text" | "arrival";
  mine: boolean;
};
export function useStreetChat() {
  const [items, setItems] = useState<Message[]>([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [expanded, setExpanded] = useState(false),
    [loading, setLoading] = useState(true);
  const fetching = useRef(false),
    generation = useRef(0),
    older = useRef(false);
  const load = useCallback(
    async (more = false) => {
      if (fetching.current) return;
      fetching.current = true;
      const gen = generation.current;
      try {
        const last = items[items.length - 1];
        const r = await native.rpc<{ items: Message[] }>("chat_list", {
          street_id: streetID,
          ...(more && last
            ? { before_at: last.created_at, before_id: last.id }
            : {}),
        });
        if (gen !== generation.current) return;
        setItems((previous) =>
          more
            ? [
                ...previous,
                ...r.items.filter((x) => !previous.some((p) => p.id === x.id)),
              ]
            : r.items,
        );
        setError("");
      } catch {
        if (gen === generation.current)
          setError("チャットを取得できません。再読み込みしてください。");
      } finally {
        fetching.current = false;
        setLoading(false);
      }
    },
    [items],
  );
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  useEffect(() => {
    const counter = generation;
    void loadRef.current();
    void pendingCommand("chat_send")
      .then((p) => {
        if (p) setText(String(p.body.body ?? ""));
      })
      .catch(() => {});
    const timer = setInterval(() => {
      if (AppState.currentState === "active" && !older.current)
        void loadRef.current();
    }, 5000);
    return () => {
      counter.current++;
      clearInterval(timer);
    };
  }, []);
  async function send() {
    if (busy || !text.trim()) return;
    setBusy(true);
    try {
      await submitCommand("chat_send", {
        street_id: streetID,
        body: text.trim(),
      });
      setText("");
      older.current = false;
      await loadRef.current();
    } catch (e) {
      setError(
        String(e).includes("pending_command_exists")
          ? "前回の送信結果が未確認です。前回の内容で再試行してください。"
          : "送信できませんでした。名前の設定・通信を確認し、同じ内容で再試行してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function action(op: string, p: Record<string, unknown>) {
    generation.current++;
    try {
      await native.rpc(op, p);
      if (op === "chat_delete")
        setItems((previous) =>
          previous.map((m) =>
            m.id === p.id ? { ...m, body: null, deleted: true } : m,
          ),
        );
      if (op === "block_set" && p.blocked)
        setItems((previous) =>
          previous.filter((m) => m.author_id !== p.account_id),
        );
      older.current = false;
      await loadRef.current();
    } catch {
      setError("操作できませんでした。再試行してください。");
    }
  }

  function toggleExpanded() {
    setExpanded((value) => !value);
    older.current = false;
    void loadRef.current();
  }
  function beginHistory() {
    setExpanded(true);
    older.current = true;
  }
  function loadMore() {
    older.current = true;
    void loadRef.current(true);
  }
  function reload() {
    void loadRef.current();
  }
  return {
    items,
    text,
    setText,
    error,
    busy,
    expanded,
    loading,
    send,
    action,
    toggleExpanded,
    beginHistory,
    loadMore,
    reload,
  };
}
