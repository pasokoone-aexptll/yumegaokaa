import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
import { StreetEvent } from "../lib/events";
import { streetChanges } from "../lib/streetChanges";

type Participant = { account_id: string; display_name: string };

export function useEventDetail(id: string) {
  const [event, setEvent] = useState<StreetEvent>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [roster, setRoster] = useState<Participant[]>();
  const [rosterLoading, setRosterLoading] = useState(false);
  const [operator, setOperator] = useState(false);
  const generation = useRef(0);
  const request = useRef(0);
  const mutating = useRef(false);
  const rosterRequest = useRef(0);

  const loadRoster = useCallback(async () => {
    const gen = generation.current;
    const seq = ++rosterRequest.current;
    setRosterLoading(true);
    setRoster(undefined);
    try {
      const result = await native.rpc<{ items: Participant[] }>(
        "event_roster",
        { id },
      );
      if (gen === generation.current && seq === rosterRequest.current)
        setRoster(result.items);
    } catch {
      if (gen === generation.current && seq === rosterRequest.current)
        setError(
          "参加者一覧を取得できません。運営の場合は追加認証と通信を確認してください。",
        );
    } finally {
      if (seq === rosterRequest.current) setRosterLoading(false);
    }
  }, [id]);

  const load = useCallback(async () => {
    const gen = generation.current;
    const seq = ++request.current;
    setLoading(true);
    try {
      const result = await native.rpc<StreetEvent>("event_get", { id });
      if (gen !== generation.current || seq !== request.current) return;
      setEvent(result);
      setError("");
      // This flag only exposes the control. event_roster still enforces MFA
      // and operator authorization on the server for non-hosts.
      const access = result.mine
        ? { operator: false }
        : await native
            .rpc<{ operator: boolean }>("operator_status", {})
            .catch(() => ({ operator: false }));
      if (gen === generation.current && seq === request.current) {
        setOperator(access.operator === true);
        if (result.mine || access.operator) await loadRoster();
        else setRoster(undefined);
      }
    } catch {
      if (gen !== generation.current || seq !== request.current) return;
      // Do not leave actionable stale details after an unsuccessful refresh.
      setEvent(undefined);
      setOperator(false);
      setRoster(undefined);
      setError(
        "イベントを取得できません。接続を確認して再試行してください。終了・中止後は表示されません。",
      );
    } finally {
      if (gen === generation.current && seq === request.current)
        setLoading(false);
    }
  }, [id, loadRoster]);

  useFocusEffect(
    useCallback(() => {
      generation.current++;
      setRoster(undefined);
      setOperator(false);
      void load();
      return () => {
        generation.current++;
      };
    }, [load]),
  );

  async function act(
    operation: "event_register" | "event_cancel",
    payload: Record<string, unknown>,
  ) {
    if (mutating.current) return;
    mutating.current = true;
    setBusy(true);
    request.current++; // Earlier reads must not undo a newer mutation.
    const gen = generation.current;
    try {
      await native.rpc(operation, { id, ...payload });
      if (gen !== generation.current) return;
      setRoster(undefined);
      rosterRequest.current++;
      setRosterLoading(false);
      if (operation === "event_cancel") {
        setCanceled(true);
        setEvent(undefined);
        setLoading(false);
        setError("");
      } else {
        await load();
      }
      streetChanges.notify();
    } catch {
      if (gen !== generation.current) return;
      // An absent reply does not establish failure: read the authoritative state.
      await load();
      if (gen === generation.current)
        setError("操作結果を確認してください。通信が戻ったら再取得できます。");
    } finally {
      mutating.current = false;
      setBusy(false);
    }
  }

  return {
    event,
    error,
    loading,
    busy,
    canceled,
    roster,
    rosterLoading,
    operator,
    load,
    act,
    loadRoster,
  };
}
