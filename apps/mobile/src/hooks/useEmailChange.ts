import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
export function useEmailChange() {
  const [email, setEmail] = useState(""),
    [pending, setPending] = useState(""),
    [next, setNext] = useState(""),
    [oldCode, setOldCode] = useState(""),
    [newCode, setNewCode] = useState(""),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const load = useCallback(async () => {
    const a = await native.accountDetails();
    setEmail(a.email);
    setPending(a.new_email);
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setStatus("アカウントを取得できません"));
    }, [load]),
  );
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try {
      await work();
    } catch {
      setStatus("確認できませんでした。コードと通信を確認してください");
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    await run(async () => {
      await native.changeEmail(next.trim());
      await load();
      setOldCode("");
      setNewCode("");
      setStatus("新旧のメールにコードを送りました");
    });
  }
  async function verify(address: string, code: string) {
    await run(async () => {
      const r = await native.verifyEmailChange(address, code.trim());
      if (r.complete) {
        await native.resume();
        await load();
        setOldCode("");
        setNewCode("");
        setStatus("メールアドレスを変更しました");
      } else setStatus("もう一方のメールも確認してください");
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
    send,
    verify,
  };
}
