import { streetChanges } from "../lib/streetChanges";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  useDenshinDraft,
  updateDenshinDraft,
  clearDenshinDraft,
} from "../lib/denshinDraft";
import {
  pendingCommand,
  discardPendingCommand,
  submitCommand,
  cancelPendingCommand,
} from "../lib/commands";
import { denshinError } from "../lib/denshin";
import { streetID } from "../lib/native";
import { sessionState } from "../lib/sessionState";
export function useDenshinEditor() {
  const draft = useDenshinDraft();
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [restoring, setRestoring] = useState(true),
    [error, setError] = useState("");
  const [pending, setPending] = useState<{
    kind: string;
    body: Record<string, unknown>;
  }>();
  const running = useRef(false);
  useEffect(() => {
    let live = true;
    void Promise.all([
      pendingCommand("denshin_create"),
      pendingCommand("denshin_edit"),
    ])
      .then(([create, edit]) => {
        if (!live) return;
        const command = edit ?? create;
        if (command) {
          const b = command.body;
          setPending({
            kind: edit ? "denshin_edit" : "denshin_create",
            body: b,
          });
          updateDenshinDraft({
            id: b.id as string | undefined,
            revision: b.revision as number | undefined,
            body: String(b.body),
            recruiting: Boolean(b.recruiting),
            limited: b.capacity !== null,
            capacity: Number(b.capacity ?? 12),
            location: [Number(b.longitude), Number(b.latitude)],
          });
        }
      })
      .catch((e) => {
        if (live) setError(denshinError(e));
      })
      .finally(() => {
        if (live) setRestoring(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function save(confirmClose = false) {
    if (running.current || restoring) return;
    if (!draft.body.trim() || !draft.location) {
      setError("メッセージを入力し、マップ上の場所を選んでください。");
      return;
    }
    const kind =
      pending?.kind ?? (draft.id ? "denshin_edit" : "denshin_create");
    const body = pending?.body ?? {
      ...(draft.id
        ? { id: draft.id, revision: draft.revision }
        : { street_id: streetID }),
      body: draft.body.trim(),
      longitude: draft.location[0],
      latitude: draft.location[1],
      recruiting: draft.recruiting,
      capacity: draft.limited ? draft.capacity : null,
      confirm_close: confirmClose,
    };
    running.current = true;
    setBusy(true);
    setError("");
    setPending({ kind, body });
    const session = sessionState.get().revision;
    try {
      const result = await submitCommand<{ id: string }>(kind, body);
      if (session !== sessionState.get().revision) return;
      clearDenshinDraft();
      streetChanges.notify();
      setPending(undefined);
      router.replace({ pathname: "/map-pin", params: { id: result.id } });
    } catch (e) {
      if (session === sessionState.get().revision) setError(denshinError(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  async function revise() {
    if (!pending || running.current) return;
    running.current = true;
    setBusy(true);
    const session = sessionState.get().revision;
    try {
      const result = await cancelPendingCommand<{ id: string }>(pending.kind);
      if (session !== sessionState.get().revision) return;
      setPending(undefined);
      if (result) {
        clearDenshinDraft();
        router.replace({ pathname: "/map-pin", params: { id: result.id } });
      } else setError("");
    } catch (e) {
      setError(denshinError(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  async function discard() {
    if (running.current || restoring) return;
    running.current = true;
    const session = sessionState.get().revision;
    try {
      if (pending) await discardPendingCommand(pending.kind);
      if (session !== sessionState.get().revision) return;
      clearDenshinDraft();
      setPending(undefined);
      router.back();
    } catch (e) {
      if (session === sessionState.get().revision) setError(denshinError(e));
    } finally {
      running.current = false;
    }
  }
  async function remove() {
    if (!draft.id || !draft.original || pending || running.current) return;
    running.current = true;
    setBusy(true);
    const session = sessionState.get().revision;
    try {
      await submitCommand("denshin_delete", {
        id: draft.id,
        revision: draft.original.revision,
      });
      if (session !== sessionState.get().revision) return;
      clearDenshinDraft();
      streetChanges.notify();
      router.dismissTo("/(tabs)");
    } catch (e) {
      setError(denshinError(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    draft,
    busy: busy || restoring,
    error,
    locked: !!pending,
    save,
    revise,
    discard,
    remove,
  };
}
