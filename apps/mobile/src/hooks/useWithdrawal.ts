import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { native } from "../lib/native";

export function useWithdrawal() {
  const router = useRouter();
  const [request, setRequest] = useState<{ id: string; email: string }>(),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const authenticated = useRef(false);
  const confirmed = useRef(false);
  const writing = useRef(false);
  async function begin() {
    if (writing.current) return;
    writing.current = true;
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
      writing.current = false;
      setBusy(false);
    }
  }
  async function finish() {
    if (!request || writing.current) return;
    writing.current = true;
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
    } catch (error) {
      if (String(error).includes("attempt_expired")) {
        authenticated.current = false;
        confirmed.current = false;
        setRequest(undefined);
        setCode("");
        setError(
          "確認の有効期限が切れました。本人確認コードを送り直してください。",
        );
      } else {
        setError(
          "完了を確認できませんでした。通信を確認して、もう一度お試しください",
        );
      }
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return { request, code, setCode, busy, error, begin, finish };
}
