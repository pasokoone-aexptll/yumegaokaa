import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { native, streetID } from "../lib/native";
import { Recruitment } from "../lib/recruitments";
import { StreetEvent } from "../lib/events";
import { streetChanges } from "../lib/streetChanges";

export function useHomePins() {
  const [items, setItems] = useState<StreetEvent[]>([]);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const request = useRef(0);
  const fetching = useRef(false);
  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    const gen = generation.current;
    const seq = ++request.current;
    try {
      const [events, pins] = await Promise.all([
        native.rpc<{ items: StreetEvent[] }>("event_list", {
          street_id: streetID,
          mine_only: true,
        }),
        native.rpc<{ items: Recruitment[] }>("recruitment_list", {
          street_id: streetID,
        }),
      ]);
      if (gen !== generation.current || seq !== request.current) return;
      setItems(events.items);
      setRecruitments(pins.items);
      setError("");
    } catch {
      if (gen === generation.current && seq === request.current)
        setError("一覧を更新できません。接続を確認してください。");
    } finally {
      if (seq === request.current) fetching.current = false;
      if (gen === generation.current && seq === request.current)
        setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      fetching.current = false;
      void load();
      const refresh = () => {
        if (AppState.currentState === "active") void load();
      };
      const timer = setInterval(refresh, 10000);
      const unsubscribe = streetChanges.subscribe(refresh);
      const foreground = AppState.addEventListener("change", refresh);
      return () => {
        generation.current++;
        clearInterval(timer);
        unsubscribe();
        foreground.remove();
      };
    }, [load]),
  );
  return { items, recruitments, error, loading, load };
}
