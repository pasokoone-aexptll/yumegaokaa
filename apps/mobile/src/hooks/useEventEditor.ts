import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { native } from "../lib/native";
import { StreetEvent } from "../lib/events";
export function useEventEditor(id: string) {
  const [event, setEvent] = useState<StreetEvent>(),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [capacity, setCapacity] = useState(""),
    [point, setPoint] = useState<[number, number]>(),
    [ongoing, setOngoing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [latest, setLatest] = useState<StreetEvent>();
  const load = useCallback(async () => {
    try {
      const [e, clock] = await Promise.all([
        native.rpc<StreetEvent>("event_get", { id }),
        native.rpc<{ server_time: string }>("time", {}),
      ]);
      if (!e.mine) throw Error("not_host");
      setLatest(undefined);
      setEvent(e);
      setTitle(e.title);
      setDescription(e.description);
      setStart(e.starts_at);
      setEnd(e.ends_at);
      setCapacity(String(e.capacity));
      setPoint([e.longitude, e.latitude]);
      setOngoing(Date.parse(e.starts_at) <= Date.parse(clock.server_time));
      setError("");
    } catch {
      setError("イベントを編集できません");
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function save() {
    if (!event || !point) return;
    const starts = new Date(start),
      ends = new Date(end);
    if (
      !Number.isFinite(starts.getTime()) ||
      !Number.isFinite(ends.getTime())
    ) {
      setError("日時を確認してください");
      return;
    }
    setBusy(true);
    try {
      await native.rpc("event_edit", {
        id,
        revision: event.revision,
        title,
        description,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        capacity: Number(capacity),
        longitude: point[0],
        latitude: point[1],
      });
      router.back();
    } catch (cause) {
      if (String(cause).includes("conflict")) {
        try {
          const current = await native.rpc<StreetEvent>("event_get", { id });
          setLatest(current);
          setError(
            "イベントが変更されています。入力は残しています。最新内容を確認してください。",
          );
        } catch {
          setError("最新のイベントを取得できません。入力は残しています。");
        }
      } else {
        setError("保存できません。日時・定員・場所と接続を確認してください。");
      }
    } finally {
      setBusy(false);
    }
  }
  async function useLatest() {
    if (!latest || busy) return;
    setBusy(true);
    try {
      // The user explicitly chose to discard local input. Read again so the
      // replacement also reflects changes made while the comparison was open.
      await load();
    } finally {
      setBusy(false);
    }
  }
  return {
    latest,
    useLatest,
    event,
    title,
    setTitle,
    description,
    setDescription,
    start,
    setStart,
    end,
    setEnd,
    capacity,
    setCapacity,
    point,
    setPoint,
    ongoing,
    busy,
    error,
    save,
    load,
  };
}
