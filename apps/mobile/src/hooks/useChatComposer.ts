import { resolveMentions, type Recipient } from "../lib/chatMentions";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelPendingCommand,
  pendingCommand,
  submitCommand,
} from "../lib/commands";
import { streetID } from "../lib/native";

export type ChatEcho = {
  id: string;
  body: string;
  key: string;
  created_at: string;
};
export function useChatComposer(
  onSent: () => void,
  restricted: boolean,
  authors: Recipient[],
) {
  const [mentions, setMentions] = useState<{ id: string; name: string }[]>([]);
  const [text, setText] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [confirmedEchoes, setConfirmedEchoes] = useState<ChatEcho[]>([]);
  const [pendingRow, setPendingRow] = useState<{
    key: string;
    created_at: string;
  } | null>(null);
  const [rowKeys, setRowKeys] = useState<Record<string, string>>({});
  const localSequence = useRef(0);
  const newRow = () => ({
    key: `local-chat-${Date.now()}-${++localSequence.current}`,
    created_at: new Date().toISOString(),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const writing = useRef(false);
  const generation = useRef(0);
  const restore = useCallback(async () => {
    const gen = generation.current;
    setRestoring(true);
    try {
      const pending = await pendingCommand("chat_send");
      if (gen !== generation.current) return;
      if (pending) {
        const body = String(pending.body.body ?? "");
        const ids = pending.body.mention_ids;
        setMentions(
          Array.isArray(ids)
            ? ids.map((id) => ({ id: String(id), name: "" }))
            : [],
        );
        setPendingRow(newRow());
        setPendingText(body);
        setText(body);
      }
      setRestoreFailed(false);
      setError("");
    } catch {
      if (gen === generation.current) {
        setRestoreFailed(true);
        setError("前回の送信状態を読み込めませんでした。");
      }
    } finally {
      if (gen === generation.current) setRestoring(false);
    }
  }, []);
  useEffect(() => {
    const counter = generation;
    counter.current++;
    const initial = setTimeout(() => void restore(), 0);
    return () => {
      counter.current++;
      clearTimeout(initial);
    };
  }, [restore]);
  async function send() {
    if (
      writing.current ||
      restoring ||
      restoreFailed ||
      restricted ||
      !text.trim()
    )
      return;
    let recipients = mentions;
    try {
      if (pendingText === null)
        recipients = resolveMentions(text, mentions, authors);
    } catch (e) {
      setError(String((e as Error).message));
      return;
    }
    writing.current = true;
    setBusy(true);
    setError("");
    const gen = generation.current;
    const body = pendingText ?? text.trim();
    const row = pendingRow ?? newRow();
    setPendingRow(row);
    setMentions(recipients);
    setPendingText(body);
    try {
      const result = await submitCommand<{ id: string }>("chat_send", {
        street_id: streetID,
        body,
        ...(recipients.length
          ? { mention_ids: recipients.map((m) => m.id) }
          : {}),
      });
      if (gen !== generation.current) return;
      if (!result?.id) throw Error("missing_message_identity");
      setRowKeys((old) => ({ ...old, [result.id]: row.key }));
      setConfirmedEchoes((old) => [
        ...old.filter((e) => e.id !== result.id),
        { id: result.id, body, ...row },
      ]);
      setMentions([]);
      setText("");
      setPendingText(null);
      setPendingRow(null);
      onSent();
    } catch {
      if (gen === generation.current)
        setError(
          "送信結果を確認できません。同じ内容で確認するか、未確定の送信を取り消せます。",
        );
    } finally {
      writing.current = false;
      if (gen === generation.current) setBusy(false);
    }
  }
  async function revise() {
    if (writing.current || restoring) return;
    writing.current = true;
    setBusy(true);
    const gen = generation.current;
    try {
      const completed = await cancelPendingCommand<{ id: string }>("chat_send");
      if (gen !== generation.current) return;
      setPendingText(null);
      const row = pendingRow ?? newRow();
      setPendingRow(null);
      if (completed) {
        if (completed.id)
          setRowKeys((old) => ({ ...old, [completed.id]: row.key }));
        if (completed.id)
          setConfirmedEchoes((old) => [
            ...old.filter((e) => e.id !== completed.id),
            { id: completed.id, body: pendingText ?? text, ...row },
          ]);
        setMentions([]);
        setText("");
        setError("送信済みでした。削除する場合は投稿を長押ししてください。");
        onSent();
      } else setError("");
    } catch {
      if (gen === generation.current)
        setError(
          "送信状態を確認できません。通信が戻ってから再試行してください。",
        );
    } finally {
      writing.current = false;
      if (gen === generation.current) setBusy(false);
    }
  }
  const reconcileEchoes = useCallback((ids: string[]) => {
    setConfirmedEchoes((old) => old.filter((e) => !ids.includes(e.id)));
  }, []);
  return {
    mentions,
    toggleMention(id: string, name: string) {
      if (pendingText !== null || writing.current || restoring) return;
      setMentions((old) =>
        old.some((m) => m.id === id)
          ? old.filter((m) => m.id !== id)
          : old.length < 5
            ? [...old, { id, name }]
            : old,
      );
    },
    pendingText,
    pendingRow,
    rowKeys,
    confirmedEchoes,
    reconcileEchoes,
    text,
    setText,
    error,
    busy,
    restoring,
    restoreFailed,
    restore,
    send,
    revise,
    pending: pendingText !== null,
  };
}
