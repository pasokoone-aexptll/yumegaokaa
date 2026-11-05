import { localBlocks } from "../lib/localBlocks";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
import { Recruitment } from "../lib/recruitments";
import { streetChanges } from "../lib/streetChanges";

export function useRecruitmentDetail(id: string) {
  const [pin, setPin] = useState<Recruitment>();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const generation = useRef(0);
  const request = useRef(0);
  const writing = useRef(false);
  const dirty = useRef(false);
  const baseline = useRef<Recruitment | undefined>(undefined);
  const closed = useRef(false);
  const load = useCallback(
    async (discard = false) => {
      if (writing.current || closed.current) return;
      const gen = generation.current;
      const seq = ++request.current;
      try {
        const result = await native.rpc<Recruitment>("recruitment_get", { id });
        if (gen !== generation.current || seq !== request.current) return;
        if (localBlocks.hidden(result.author_id)) {
          setPin(undefined);
          return;
        }
        // Keep the original revision while local input is dirty; a concurrent
        // edit must be rejected by the server rather than silently overwritten.
        if (discard || !dirty.current) {
          dirty.current = false;
          baseline.current = result;
          setPin(result);
          setTitle(result.title);
        } else {
          if (baseline.current) setPin({ ...baseline.current, icon_path: result.icon_path, icon_until: result.icon_until });
        }
        setError("");
      } catch (cause) {
        if (gen !== generation.current || seq !== request.current) return;
        setPin(undefined);
        if (String(cause).includes("not_found")) {
          closed.current = true;
          setEnded(true);
          setError("");
        } else {
          setError("募集を取得できません。接続を確認してください。");
        }
      } finally {
        if (gen === generation.current && seq === request.current)
          setLoading(false);
      }
    },
    [id],
  );
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      void load();
      const refresh = () => {
        if (AppState.currentState === "active") void load();
      };
      const timer = setInterval(refresh, 10000);
      const unsubscribeBlocks = localBlocks.subscribe(() => {
        if (baseline.current && localBlocks.hidden(baseline.current.author_id))
          setPin(undefined);
        void load();
      });
      const unsubscribe = streetChanges.subscribe(refresh);
      const foreground = AppState.addEventListener("change", refresh);
      return () => {
        generation.current++;
        clearInterval(timer);
        unsubscribe();
        unsubscribeBlocks();
        foreground.remove();
      };
    }, [load]),
  );
  async function act(operation: "recruitment_edit" | "recruitment_end") {
    if (writing.current || !pin) return;
    writing.current = true;
    setBusy(true);
    request.current++;
    const gen = generation.current;
    try {
      await native.rpc(operation, { id, title, revision: pin.revision });
      if (gen !== generation.current) return;
      if (operation === "recruitment_end") {
        closed.current = true;
        setPin(undefined);
        setEnded(true);
        setError("");
      } else {
        dirty.current = false;
        writing.current = false;
        await load();
      }
      streetChanges.notify();
    } catch {
      if (gen !== generation.current) return;
      writing.current = false;
      await load();
      if (gen === generation.current && !closed.current)
        setError(
          "変更を確認できません。入力を残しています。最新の題名を読み込むか、接続後に再試行してください。",
        );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return {
    pin,
    title,
    error,
    busy,
    loading,
    ended,
    load,
    act,
    editTitle(value: string) {
      dirty.current = true;
      setTitle(value);
    },
  };
}
