import { localBlocks } from "../lib/localBlocks";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { native, streetID, displayClock } from "../lib/native";
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
  const clock = useRef<{ server: number; local: number } | null>(null);
  const load = useCallback(async (force = false) => {
    if (fetching.current && !force) return;
    fetching.current = true;
    const gen = generation.current;
    const seq = ++request.current;
    try {
      const synced = await displayClock();
      const [events, pins] = await Promise.all([
        native.rpc<{ items: StreetEvent[] }>("event_list", {
          street_id: streetID,
          mine_only: false,
        }),
        native.rpc<{ items: Recruitment[] }>("recruitment_list", {
          street_id: streetID,
        }),
      ]);
      if (gen !== generation.current || seq !== request.current) return;
      clock.current = synced;
      const now = synced.server + native.monotonicTime() - synced.local;
      setItems(events.items.filter((e) => Date.parse(e.ends_at) > now));
      setRecruitments(
        pins.items.filter(
          (p) =>
            !localBlocks.hidden(p.author_id) && Date.parse(p.expires_at) > now,
        ),
      );
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
      const expiry = setInterval(() => {
        const synced = clock.current;
        if (!synced) return;
        const now = synced.server + native.monotonicTime() - synced.local;
        setItems((previous) => {
          const active = previous.filter((e) => Date.parse(e.ends_at) > now);
          return active.length === previous.length ? previous : active;
        });
        setRecruitments((previous) => {
          const active = previous.filter((p) => Date.parse(p.expires_at) > now);
          return active.length === previous.length ? previous : active;
        });
      }, 1000);
      const unsubscribeBlocks = localBlocks.subscribe(() => {
        setRecruitments((items) =>
          items.filter((p) => !localBlocks.hidden(p.author_id)),
        );
        void load();
      });
      const unsubscribe = streetChanges.subscribe(refresh);
      const foreground = AppState.addEventListener("change", refresh);
      return () => {
        generation.current++;
        clearInterval(timer);
        clearInterval(expiry);
        unsubscribe();
        unsubscribeBlocks();
        foreground.remove();
      };
    }, [load]),
  );
  return { items, recruitments, error, loading, load };
}
