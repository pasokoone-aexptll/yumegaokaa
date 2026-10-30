import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";

export function useEmailChange() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState("");
  const [next, setNext] = useState("");
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const generation = useRef(0);
  const sequence = useRef(0);
  const writing = useRef(false);

  const load = useCallback(async () => {
    const gen = generation.current;
    const seq = ++sequence.current;
    setLoading(true);
    try {
      const account = await native.accountDetails();
      if (gen !== generation.current || seq !== sequence.current) return false;
      setEmail(account.email);
      setPending(account.new_email);
      setReady(true);
      setStatus("");
      return true;
    } catch {
      if (gen !== generation.current || seq !== sequence.current) return false;
      setReady(false);
      setStatus(
        "アカウントを取得できません。接続を確認して再試行してください。",
      );
      return false;
    } finally {
      if (gen === generation.current && seq === sequence.current)
        setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      generation.current++;
      void load();
      return () => {
        generation.current++;
        setOldCode("");
        setNewCode("");
      };
    }, [load]),
  );

  async function run(work: (current: () => boolean) => Promise<void>) {
    if (writing.current) return;
    writing.current = true;
    sequence.current++;
    const gen = generation.current;
    setBusy(true);
    setStatus("");
    try {
      await work(() => gen === generation.current);
    } catch {
      if (gen !== generation.current) return;
      // Sending or verification can succeed even when its response is lost.
      const refreshed = await load();
      if (refreshed && gen === generation.current)
        setStatus(
          "操作結果を確認できませんでした。現在のメールと変更先を確認してください。",
        );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  async function send() {
    await run(async (current) => {
      await native.changeEmail(next.trim());
      if (!current()) return;
      const refreshed = await load();
      if (!current()) return;
      setOldCode("");
      setNewCode("");
      if (refreshed) setStatus("新旧のメールにコードを送りました");
    });
  }

  async function verify(address: string, code: string) {
    await run(async (current) => {
      const result = await native.verifyEmailChange(address, code.trim());
      if (result.complete) {
        await native.resume();
        if (!current()) return;
        const refreshed = await load();
        if (!current()) return;
        setOldCode("");
        setNewCode("");
        setNext("");
        if (refreshed) setStatus("メールアドレスを変更しました");
      } else if (current()) {
        if (address === email) setOldCode("");
        else setNewCode("");
        setStatus("もう一方のメールも確認してください");
      }
    });
  }

  return {
    email,
    pending,
    next,
    setNext,
    oldCode,
    setOldCode,
    newCode,
    setNewCode,
    busy,
    status,
    loading,
    ready,
    load,
    send,
    verify,
  };
}
