import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
type Invite = {
  id: string;
  issuer_name: string | null;
  recipient_name: string | null;
  used_at: string | null;
  revoked_at: string | null;
  expires_at: string;
  created_at: string;
};
export function useOperatorDashboard() {
  const [operator, setOperator] = useState(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [factor, setFactor] = useState(""),
    [secret, setSecret] = useState(""),
    [code, setCode] = useState(""),
    [invites, setInvites] = useState<Invite[]>([]);
  const [summary, setSummary] = useState<{
    active_members: number;
    active_invitations: number;
  } | null>(null);
  const generation = useRef(0);
  const request = useRef(0);
  const writing = useRef(false);
  const [more, setMore] = useState(false);
  const load = useCallback(async (before?: Invite) => {
    const gen = generation.current;
    const seq = ++request.current;
    try {
      const dashboard = await native.rpc<{
        active_members: number;
        active_invitations: number;
      }>("operator_dashboard", {});
      const list = await native.rpc<{ items: Invite[] }>(
        "operator_invites",
        before ? { before: before.created_at, before_id: before.id } : {},
      );
      if (gen !== generation.current || seq !== request.current) return;
      setSummary(dashboard);
      setInvites((previous) =>
        before
          ? [
              ...previous,
              ...list.items.filter(
                (item) => !previous.some((old) => old.id === item.id),
              ),
            ]
          : list.items,
      );
      setMore(list.items.length === 100);
      setReady(true);
    } catch (error) {
      if (gen !== generation.current || seq !== request.current) return;
      setReady(false);
      setInvites([]);
      setSummary(null);
      setMore(false);
      throw error;
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      generation.current++;
      setOperator(false);
      setFactor("");
      setMore(false);
      setReady(false);
      setSecret("");
      setCode("");
      setError("");
      setInvites([]);
      setSummary(null);
      void (async () => {
        const status = await native.rpc<{ operator: boolean }>(
          "operator_status",
          {},
        );
        if (!live) return;
        setOperator(status.operator);
        if (!status.operator) return;
        const factors = await native.mfaFactors();
        if (!live) return;
        setFactor(
          factors.factors.find(
            (f) => f.factor_type === "totp" && f.status === "verified",
          )?.id ?? "",
        );
        try {
          await load();
        } catch {
          /* AAL1 requires the code form below. */
        }
      })().catch((e) => {
        if (live) setError(String(e));
      });
      return () => {
        live = false;
        generation.current++;
        request.current++;
        setReady(false);
        setInvites([]);
        setSummary(null);
        setSecret("");
        setCode("");
      };
    }, [load]),
  );
  async function run(work: (current: () => boolean) => Promise<void>) {
    if (writing.current) return;
    writing.current = true;
    request.current++;
    const gen = generation.current;
    const current = () => gen === generation.current;
    setBusy(true);
    setError("");
    try {
      await work(current);
    } catch (e) {
      if (current()) setError(String(e));
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function enroll() {
    await run(async (current) => {
      const result = await native.mfaEnroll();
      if (!current()) return;
      setFactor(result.id);
      setSecret(result.totp.secret);
    });
  }
  async function verify() {
    await run(async (current) => {
      await native.mfaVerify(factor, code);
      if (!current()) return;
      setSecret("");
      setCode("");
      await load();
    });
  }
  async function revoke(id: string) {
    await run(async (current) => {
      try {
        await native.rpc("operator_invite_revoke", { id });
      } finally {
        if (current()) await load();
      }
    });
  }
  return {
    operator,
    ready,
    busy,
    error,
    factor,
    secret,
    code,
    setCode,
    invites,
    summary,
    more,
    enroll,
    verify,
    revoke,
    refresh: () => run(() => load()),
    next: () => run(() => load(invites.at(-1))),
  };
}
