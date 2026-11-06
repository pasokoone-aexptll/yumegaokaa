import { useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";

const key = "map.showEntryPlacesDuringVisit";

export function useEntryPlacesPreference() {
  const [visible, setVisible] = useState(false);
  const current = useRef(false);
  const changed = useRef(false);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    void SecureStore.getItemAsync(key).then(value => {
      if (mounted && !changed.current) {
        current.current = value === "1";
        setVisible(current.current);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  function toggle() {
    changed.current = true;
    const next = !current.current;
    current.current = next;
    setVisible(next);
    writes.current = writes.current.then(() =>
      SecureStore.setItemAsync(key, next ? "1" : "0")
    ).catch(() => {});
  }
  return { visible, toggle };
}
