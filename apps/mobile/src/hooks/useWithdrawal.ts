import { useRef, useState } from "react";
import { router } from "expo-router";
import { native } from "../lib/native";

export function useWithdrawal() {
  const [request, setRequest] = useState<{ id: string; email: string }>(),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const authenticated = useRef(false);
  const confirmed = useRef(false);
  async function begin() {
    setBusy(true);
    setError("");
    try {
      const account = await native.accountDetails();
      const ticket = await native.rpc<{ id: string }>("withdraw_prepare", {});
      await native.sendOTP(account.email);
      authenticated.current = false;
      confirmed.current = false;
      setCode("");
      setRequest({ id: ticket.id, email: account.email });
    } catch {
      setError("確認コードを送れませんでした");
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (!request) return;
    setBusy(true);
    setError("");
    try {
      if (!authenticated.current) {
        await native.verifyOTP(request.email, code.trim());
        authenticated.current = true;
      }
      if (!confirmed.current) {
        await native.rpc("withdraw_confirm", { id: request.id });
        confirmed.current = true;
      }
      await native.logout();
      router.replace("/");
    } catch {
      setError(
        "完了を確認できませんでした。通信を確認して、もう一度お試しください",
      );
    } finally {
      setBusy(false);
    }
  }
  return { request, code, setCode, busy, error, begin, finish };
}
