import { readChatWindow, ChatCursor } from "../lib/chatWindow";
import { streetChanges } from "../lib/streetChanges";
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
    [loading, setLoading] = useState(true),
    [hasNew, setHasNew] = useState(false);
  const fetching = useRef(false),
    generation = useRef(0),
    older = useRef(false),
    itemsRef = useRef<Message[]>([]),
    lastRead = useRef(0),
    pendingRefresh = useRef(false),
    mounted = useRef(true);
  const load = useCallback(async (more = false) => {
    if (!mounted.current) return;
    if (fetching.current) {
      if (!more) pendingRefresh.current = true;
      return;
    }
    fetching.current = true;
    const gen = generation.current;
    try {
      const previous = itemsRef.current;
      const last = previous.at(-1);
      const page = async (cursor?: ChatCursor) => {
        // Leave margin under the server's five reads / ten seconds limit.
        const wait = Math.max(0, 2600 - (Date.now() - lastRead.current));
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
        if (gen !== generation.current) return [];
        lastRead.current = Date.now();
        return (
          await native.rpc<{ items: Message[] }>("chat_list", {
            street_id: streetID,
            ...(cursor
              ? { before_at: cursor.created_at, before_id: cursor.id }
              : {}),
          })
        ).items;
      };
      const result = more
        ? await page(last)
        : await readChatWindow(page, last, () => gen !== generation.current);
      if (gen !== generation.current || !result) return;
      const next = more
        ? [
            ...previous,
            ...result.filter((x) => !previous.some((p) => p.id === x.id)),
          ]
        : result;
      if (
        !more &&
        older.current &&
        previous[0] &&
        next[0]?.id !== previous[0].id &&
        next[0]?.created_at >= previous[0].created_at
      )
        setHasNew(true);
      itemsRef.current = next;
      setItems(next);
      setError("");
    } catch {
      if (gen === generation.current)
        setError("チャットを取得できません。再読み込みしてください。");
    } finally {
      fetching.current = false;
      if (gen === generation.current) setLoading(false);
      if (pendingRefresh.current && gen === generation.current) {
        pendingRefresh.current = false;
        setTimeout(() => void loadRef.current(), 0);
      }
    }
  }, []);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  useEffect(() => {
    mounted.current = true;
    const counter = generation;
    void loadRef.current();
    void pendingCommand("chat_send")
      .then((p) => {
        if (p) setText(String(p.body.body ?? ""));
      })
      .catch(() => {});
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void loadRef.current();
    }, 5000);
    const unsubscribe = streetChanges.subscribe(() => {
      if (AppState.currentState === "active") void loadRef.current();
    });
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadRef.current();
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      foreground.remove();
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
      if (op === "chat_delete") {
        itemsRef.current = itemsRef.current.map((m) =>
          m.id === p.id ? { ...m, body: null, deleted: true } : m,
        );
      }
      if (op === "block_set" && p.blocked) {
        itemsRef.current = itemsRef.current.filter(
          (m) => m.author_id !== p.account_id,
        );
      }
      setItems(itemsRef.current);
      older.current = false;
      await loadRef.current();
    } catch {
      setError("操作できませんでした。再試行してください。");
    }
  }

  function toggleExpanded() {
    setExpanded((value) => !value);
    older.current = false;
    itemsRef.current = [];
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
  function followLatest() {
    older.current = false;
    setHasNew(false);
  }
  return {
    hasNew,
    followLatest,
    readingHistory: older,
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
