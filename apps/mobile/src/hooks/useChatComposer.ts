import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelPendingCommand,
  pendingCommand,
  submitCommand,
} from "../lib/commands";
import { streetID } from "../lib/native";

export function useChatComposer(onSent: () => void, restricted: boolean) {
  const [text, setText] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
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
    writing.current = true;
    setBusy(true);
    setError("");
    const gen = generation.current;
    const body = pendingText ?? text.trim();
    setPendingText(body);
    try {
      await submitCommand("chat_send", { street_id: streetID, body });
      if (gen !== generation.current) return;
      setText("");
      setPendingText(null);
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
      const completed = await cancelPendingCommand("chat_send");
      if (gen !== generation.current) return;
      setPendingText(null);
      if (completed) {
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
  return {
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
