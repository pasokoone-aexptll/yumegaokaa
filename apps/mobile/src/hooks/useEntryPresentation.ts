import { useEffect, useRef, useState } from "react";
import type { EntrySheetState } from "../lib/entrySheetState";
/** Minimum duration belongs to presentation; errors/cancel are never delayed. */
export function useEntryPresentation(actual: EntrySheetState["sheet"]) {
  const started = useRef<number | null>(null);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (actual === "scanning" || actual === "checking") {
      started.current ??= Date.now();
      return;
    }
    if (actual !== "success") return;
    const remaining = Math.max(
      0,
      3000 - (Date.now() - (started.current ?? Date.now())),
    );
    const timer = setTimeout(() => setFinished(true), remaining);
    return () => clearTimeout(timer);
  }, [actual]);
  return actual === "success" && !finished ? "checking" : actual;
}
