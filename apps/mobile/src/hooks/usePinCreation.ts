import { eventInputError } from "../lib/eventInput";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { usePinDraft, updateDraft, clearDraft } from "../lib/pinDraft";
import {
  submitCommand,
  pendingCommand,
  cancelPendingCommand,
} from "../lib/commands";
import { native, streetID } from "../lib/native";
export function usePinCreation() {
  const draft = usePinDraft();
  const { kind, title, description, starts, ends, location, capacity } = draft;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [restoring, setRestoring] = useState(true);
  const [eventBody, setEventBody] = useState<Record<string, unknown>>();
  const [recruitBody, setRecruitBody] = useState<Record<string, unknown>>();
  useEffect(() => {
    let live = true;
    void Promise.all([
      pendingCommand("event_create"),
      pendingCommand("recruitment_create"),
    ])
      .then(([event, recruitment]) => {
        if (!live) return;
        if (event) {
          const body = event.body;
          setEventBody(body);
          updateDraft({
            kind: "event",
            title: String(body.title ?? ""),
            description: String(body.description ?? ""),
            starts: String(body.starts_at ?? ""),
            ends: String(body.ends_at ?? ""),
            capacity: String(body.capacity ?? 20),
            location: [Number(body.longitude), Number(body.latitude)],
          });
        } else if (recruitment) {
          setRecruitBody(recruitment.body);
          updateDraft({
            kind: "recruitment",
            title: String(recruitment.body.title ?? ""),
          });
        }
      })
      .catch(() => {
        if (live)
          setError(
            "前回の送信を読み込めませんでした。画面を開き直してください。",
          );
      })
      .finally(() => {
        if (live) setRestoring(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function revise() {
    setBusy(true);
    setError("");
    try {
      const result = await cancelPendingCommand<{ id: string }>(
        kind === "event" ? "event_create" : "recruitment_create",
      );
      if (result) {
        clearDraft();
        router.replace({
          pathname: kind === "event" ? "/events/[id]" : "/recruitments/[id]",
          params: { id: result.id },
        });
        return;
      }
      setRecruitBody(undefined);
      setEventBody(undefined);
      setError(
        "未確定の送信を取り消しました。内容を修正し、募集の場合は現在地を取り直してください。",
      );
    } catch {
      setError(
        "前回の送信が未確認です。通信復旧後にもう一度確認してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function discard() {
    if (busy || restoring) return;
    setBusy(true);
    setError("");
    try {
      const result = await cancelPendingCommand<{ id: string }>(
        kind === "event" ? "event_create" : "recruitment_create",
      );
      clearDraft();
      if (result) {
        router.replace({
          pathname: kind === "event" ? "/events/[id]" : "/recruitments/[id]",
          params: { id: result.id },
        });
      } else router.back();
    } catch {
      setError(
        "送信結果を確認できません。下書きを保持しています。通信復旧後に再試行してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function locate() {
    if (busy || restoring) return;
    if (!title.trim()) {
      setError("募集ピン名を入力してください。");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const existing = await pendingCommand("recruitment_create");
      if (existing) {
        setRecruitBody(existing.body);
        setError("前回の送信結果を同じ内容で確認します。");
        return;
      }
      const p = await native.currentLocation();
      const v = await native.rpc<{
        visit: { visit_id: string; can_update: boolean; ghost?: boolean } | null;
      }>("get_my_visit", {});
      if (v.visit?.ghost) {
        setError("募集するには通常モードへ戻してください。");
        return;
      }
      if (!v.visit?.can_update || p.accuracy > 50)
        throw Error("location_or_visit");
      setRecruitBody({
        visit_id: v.visit.visit_id,
        title: title.trim(),
        longitude: p.longitude,
        latitude: p.latitude,
        accuracy: p.accuracy,
        observed_at: new Date(p.observed_at).toISOString(),
      });
      setError("");
    } catch {
      setError("この端末で入街し、精度のよい現在地を取得してください。");
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (restoring || busy) return;
    setError("");
    if (kind !== "event") {
      if (!recruitBody) {
        setError("先に公開する現在地を確認してください。");
        return;
      }
      setBusy(true);
      try {
        const state = await native.resume();
        if (state.visit.ghost || state.pending_mode === "ghost") {
          setError("募集するには通常モードへ戻してください。");
          return;
        }
        const r = await submitCommand<{ id: string }>(
          "recruitment_create",
          recruitBody,
        );
        clearDraft();
        router.replace({
          pathname: "/recruitments/[id]",
          params: { id: r.id },
        });
      } catch {
        setError(
          "募集を作成できませんでした。前回の結果を確認してから再試行してください。",
        );
      } finally {
        setBusy(false);
      }
      return;
    }
    const invalid = eventInputError(starts, ends, capacity);
    if (invalid || !location) {
      setError(invalid ?? "開催場所を選んでください。");
      return;
    }
    const start = new Date(starts),
      end = new Date(ends);
    setBusy(true);
    try {
      const body = eventBody ?? {
        street_id: streetID,
        title: title.trim(),
        description,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        longitude: location[0],
        latitude: location[1],
        capacity: Number(capacity),
      };
      setEventBody(body);
      const r = await submitCommand<{ id: string }>("event_create", body);
      clearDraft();
      router.replace({ pathname: "/events/[id]", params: { id: r.id } });
    } catch {
      setError(
        "作成できませんでした。入力・街の範囲・接続を確認してください。通信が不明な場合は同じ内容で再試行します。",
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    draft,
    busy: busy || restoring,
    error,
    recruitBody,
    publish,
    revise,
    discard,
    locate,
    locked: !!eventBody || !!recruitBody,
    restoring,
  };
}
