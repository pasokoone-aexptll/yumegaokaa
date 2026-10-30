import { useRef, useState } from "react";
import { native } from "../lib/native";
import type { Member } from "../lib/member";

export function useMemberActions(member: Member, onSaved: () => Promise<void>) {
  const [limit, setLimit] = useState(String(member.weekly_limit)),
    [until, setUntil] = useState(""),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const writing = useRef(false);
  async function act(op: string, p: Record<string, unknown>) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await native.rpc(op, { account_id: member.account_id, reason, ...p });
      await onSaved();
    } catch {
      await onSaved().catch(() => {});
      setError(
        "操作結果を確認できません。最新の状態と入力内容を確認してください。",
      );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  function restrict() {
    const date = new Date(until);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      setError("未来の終了日時を選択してください。");
      return;
    }
    return act("operator_chat_restrict", { until_at: date.toISOString() });
  }
  function saveLimit() {
    const value = Number(limit);
    if (
      !limit.trim() ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 1000
    ) {
      setError("招待枠は0〜1000の整数で入力してください。");
      return;
    }
    return act("operator_invite_policy", {
      weekly_limit: value,
      paused: member.invite_paused,
    });
  }
  return {
    limit,
    setLimit,
    until,
    setUntil,
    reason,
    setReason,
    error,
    busy,
    restrict,
    saveLimit,
    restore: () => act("operator_chat_restore", {}),
    toggleInvites: () =>
      act("operator_invite_policy", {
        weekly_limit: member.weekly_limit,
        paused: !member.invite_paused,
      }),
    toggleActive: () =>
      act("operator_member_state", { active: !member.active }),
  };
}
