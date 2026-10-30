import { pendingCommand, submitCommand } from "../lib/commands";
import { AccountAccessContext } from "./useAccountAccess";
import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useRef, useState } from "react";
import { native } from "../lib/native";
type Invite = {
  id: string;
  expires_at: string;
  used: boolean;
  revoked: boolean;
  expired?: boolean;
};
export function useInvitations() {
  const access = useContext(AccountAccessContext);
  const receiving = access.status === "unregistered";
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<Invite[]>([]),
    [code, setCode] = useState(""),
    [issued, setIssued] = useState<{ id: string; code: string } | null>(null),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const request = useRef(0);
  const writing = useRef(false);
  const refresh = useCallback(async () => {
    if (receiving) return;
    const gen = generation.current;
    const seq = ++request.current;
    setLoading(true);
    try {
      const pending = !!(await pendingCommand("invite_create"));
      const result = await native.rpc<{ items: Invite[] }>("invite_list", {});
      if (gen !== generation.current || seq !== request.current) return;
      setPending(pending);
      setItems(
        result.items.map((item) => ({
          ...item,
          expired: Date.parse(item.expires_at) <= Date.now(),
        })),
      );
      setStatus("");
      setIssued((current) => {
        const item = result.items.find((invite) => invite.id === current?.id);
        return !item ||
          item.used ||
          item.revoked ||
          Date.parse(item.expires_at) <= Date.now()
          ? null
          : current;
      });
    } catch {
      if (gen === generation.current && seq === request.current) {
        setItems([]);
        setIssued(null);
        setStatus("招待一覧を取得できませんでした。");
      }
    } finally {
      if (gen === generation.current && seq === request.current)
        setLoading(false);
    }
  }, [receiving]);
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      setBusy(writing.current);
      void refresh();
      return () => {
        generation.current++;
        request.current++;
        setIssued(null);
      };
    }, [refresh]),
  );
  async function act(op: string, p: Record<string, unknown> = {}) {
    if (writing.current) return;
    writing.current = true;
    const gen = generation.current;
    setBusy(true);
    try {
      const r =
        op === "invite_create"
          ? await submitCommand<{ id?: string; code?: string }>(
              "invite_create",
              {},
            )
          : await native.rpc<{ id?: string; code?: string }>(op, p);
      if (gen !== generation.current) return;
      if (r.code && r.id) setIssued({ id: r.id, code: r.code });
      if (op === "invite_revoke" && issued?.id === p.id) setIssued(null);
      if (op === "invite_accept") access.retry();
      setStatus(
        op === "invite_accept" ? "招待を受け付けました。" : "更新しました。",
      );
      await refresh();
    } catch (e) {
      if (gen !== generation.current) return;
      if (op === "invite_create") {
        const pending = !!(await pendingCommand("invite_create").catch(
          () => null,
        ));
        if (gen !== generation.current) return;
        setPending(pending);
      }
      if (op === "invite_revoke") await refresh();
      if (gen !== generation.current) return;
      setStatus(
        String(e).includes("rate_limited")
          ? "招待は7日間に5件までです。"
          : "処理できませんでした。コード・期限・接続を確認してください。",
      );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return {
    receiving,
    pending,
    items,
    code,
    setCode,
    issued,
    status,
    setStatus,
    busy,
    loading,
    refresh,
    act,
  };
}
