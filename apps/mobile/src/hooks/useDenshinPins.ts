import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { native, streetID } from "../lib/native";
import { streetChanges } from "../lib/streetChanges";
import { localBlocks } from "../lib/localBlocks";
import { DenshinList } from "../lib/denshin";
export function useDenshinPins() {
  const [data, setData] = useState<DenshinList>({
    items: [],
    hidden_attendance: [],
    server_time: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const sequence = useRef(0);
  const fetching = useRef(false);
  const clock = useRef({ server: 0, local: 0 });
  const load = useCallback(async (force = false) => {
    if (fetching.current && !force) return;
    fetching.current = true;
    const gen = generation.current,
      seq = ++sequence.current;
    try {
      const next = await native.rpc<DenshinList>("denshin_list", {
        street_id: streetID,
      });
      if (gen !== generation.current || seq !== sequence.current) return;
      clock.current = {
        server: Date.parse(next.server_time),
        local: native.monotonicTime(),
      };
      setData(next);
      setError("");
    } catch {
      if (gen === generation.current && seq === sequence.current)
        setError("電信PINを更新できません。接続を確認してください。");
    } finally {
      if (gen === generation.current && seq === sequence.current) {
        fetching.current = false;
        setLoading(false);
      }
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
      const interval = setInterval(refresh, 10000);
      const expiry = setInterval(() => {
        const now =
          clock.current.server + native.monotonicTime() - clock.current.local;
        setData((d) => {
          const items = d.items.filter(
            (p) =>
              Date.parse(p.expires_at) > now &&
              !localBlocks.hidden(p.author_id),
          );
          const hidden = d.hidden_attendance.filter(
            (p) => Date.parse(p.expires_at) > now,
          );
          return items.length === d.items.length &&
            hidden.length === d.hidden_attendance.length
            ? d
            : { ...d, items, hidden_attendance: hidden };
        });
      }, 1000);
      const changes = streetChanges.subscribe(refresh);
      const blocks = localBlocks.subscribe(() => void load(true));
      const foreground = AppState.addEventListener("change", refresh);
      return () => {
        generation.current++;
        sequence.current++;
        fetching.current = false;
        clearInterval(interval);
        clearInterval(expiry);
        changes();
        blocks();
        foreground.remove();
      };
    }, [load]),
  );
  return { ...data, loading, error, load };
}
