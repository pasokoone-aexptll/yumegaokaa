import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { native } from "../lib/native";
import {
  cancelPendingCommand,
  pendingCommand,
  reconcilePendingCommand,
  submitCommand,
} from "../lib/commands";
import { Attendance, DenshinPin, denshinError } from "../lib/denshin";
import { streetChanges } from "../lib/streetChanges";
import { sessionState } from "../lib/sessionState";
export function useDenshinDetail(id: string) {
  const [pin, setPin] = useState<DenshinPin>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<string>();
  const generation = useRef(0),
    sequence = useRef(0),
    writing = useRef(false);
  const clock = useRef({ server: 0, local: 0 });
  const load = useCallback(async () => {
    const gen = generation.current,
      seq = ++sequence.current;
    try {
      const result = await native.rpc<DenshinPin & { server_time: string }>(
        "denshin_get",
        { id },
      );
      if (gen !== generation.current || seq !== sequence.current) return;
      clock.current = {
        server: Date.parse(result.server_time),
        local: native.monotonicTime(),
      };
      setPin(result);
      setEnded(false);
    } catch (e) {
      if (gen === generation.current && seq === sequence.current) {
        setError(denshinError(e));
        if (String(e).includes("not_found")) {
          setEnded(true);
          setPin(undefined);
        }
      }
    } finally {
      if (gen === generation.current && seq === sequence.current)
        setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      void load();
      const kinds = [
        "denshin_attend",
        "denshin_mode",
        "denshin_host",
        "denshin_delete",
      ];
      let live = true;
      const reconcile = () =>
        Promise.all(
          kinds.map(async (k) => ({
            kind: k,
            command: await reconcilePendingCommand(k),
          })),
        )
          .then((saved) => {
            if (live) {
              setPending(saved.find((x) => x.command)?.kind);
              void load();
            }
          })
          .catch((e) => {
            if (live) setError(denshinError(e));
          })
          .finally(() => {
            if (live) setRestoring(false);
          });
      const refresh = () => {
        if (AppState.currentState === "active") {
          void load();
          void reconcile();
        }
      };
      void reconcile();
      const timer = setInterval(refresh, 10000);
      const stop = streetChanges.subscribe(refresh);
      const fg = AppState.addEventListener("change", refresh);
      return () => {
        live = false;
        generation.current++;
        sequence.current++;
        clearInterval(timer);
        stop();
        fg.remove();
      };
    }, [load]),
  );
  useEffect(() => {
    if (!pin) return;
    const timer = setInterval(() => {
      if (
        Date.parse(pin.expires_at) <=
        clock.current.server + native.monotonicTime() - clock.current.local
      ) {
        sequence.current++;
        setEnded(true);
        setPin(undefined);
        setConfirmed(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [pin]);
  const expired = () =>
    pin &&
    Date.parse(pin.expires_at) <=
      clock.current.server + native.monotonicTime() - clock.current.local;
  async function run(kind: string, body: Record<string, unknown>) {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    setError("");
    const session = sessionState.get().revision;
    try {
      await submitCommand(kind, body);
      if (session !== sessionState.get().revision) return false;
      setPending(undefined);
      sequence.current++;
      streetChanges.notify();
      if (kind === "denshin_delete") {
        setEnded(true);
        setPin(undefined);
      } else {
        await load();
        if (
          kind === "denshin_attend" &&
          body.state === "planned" &&
          body.id === id
        )
          setConfirmed(true);
      }
      return true;
    } catch (e) {
      if (session === sessionState.get().revision) {
        setError(denshinError(e));
        setPending(kind);
        await load();
      }
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function recover(cancel: boolean) {
    if (!pending || writing.current) return;
    if (!cancel) {
      try {
        const saved = await pendingCommand(pending);
        if (saved) await run(pending, saved.body);
        else setPending(undefined);
      } catch (e) {
        setError(denshinError(e));
      }
      return;
    }
    writing.current = true;
    setBusy(true);
    try {
      await cancelPendingCommand(pending);
      setPending(undefined);
      setError("");
      await load();
    } catch (e) {
      setError(denshinError(e));
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  const act = (kind: string, extra: Record<string, unknown>) =>
    pin && !restoring && !expired() && !pending
      ? run(kind, { id: pin.id, revision: pin.revision, ...extra })
      : Promise.resolve(false);
  return {
    pin,
    loading,
    busy: busy || restoring,
    error,
    ended,
    confirmed,
    setConfirmed,
    pending,
    recover,
    load,
    attend: (state: Attendance) =>
      act("denshin_attend", {
        state,
        attendance_revision: pin?.attendance_revision,
      }),
    mode: (recruiting: boolean, confirmClose = false) =>
      act("denshin_mode", { recruiting, confirm_close: confirmClose }),
    host: () => act("denshin_host", { arrived: !pin?.host_arrived }),
    remove: () => act("denshin_delete", {}),
  };
}
