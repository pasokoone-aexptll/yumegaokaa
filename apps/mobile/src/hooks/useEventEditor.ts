import {
  preserveEventEdit,
  readEventEdit,
  takeEventEdit,
} from "../lib/eventEditDraft";
import { beginPinPlacement } from "../lib/pinPlacement";
import { openMapAt } from "../lib/mapNavigation";
import { eventInputError } from "../lib/eventInput";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { native } from "../lib/native";
import { StreetEvent } from "../lib/events";
export function useEventEditor(id: string) {
  const router = useRouter();
  const [restored] = useState(() => readEventEdit(id));
  const [event, setEvent] = useState<StreetEvent | undefined>(restored?.event),
    [title, setTitle] = useState(restored?.title ?? ""),
    [description, setDescription] = useState(restored?.description ?? ""),
    [start, setStart] = useState(restored?.start ?? ""),
    [end, setEnd] = useState(restored?.end ?? ""),
    [capacity, setCapacity] = useState(restored?.capacity ?? ""),
    [point, setPoint] = useState<[number, number] | undefined>(restored?.point),
    [ongoing, setOngoing] = useState(restored?.ongoing ?? false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [latest, setLatest] = useState<StreetEvent | undefined>(restored?.latest);
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
      if (restored?.id === id) {
        takeEventEdit(id);
        return;
      }
      void load();
    }, [load, restored, id]),
  );
  function selectLocation() {
    if (!event || ongoing || busy) return;
    preserveEventEdit({
      id,
      event,
      title,
      description,
      start,
      end,
      capacity,
      point,
      ongoing,
      latest,
    });
    beginPinPlacement(point, id);
    if (point) openMapAt(router, point[0], point[1]);
    else router.dismissTo("/(tabs)");
  }
  async function save() {
    if (!event || !point) return;
    const invalid = eventInputError(start, end, capacity);
    if (invalid) {
      setError(invalid);
      return;
    }
    const starts = new Date(start),
      ends = new Date(end);
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
    selectLocation,
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
