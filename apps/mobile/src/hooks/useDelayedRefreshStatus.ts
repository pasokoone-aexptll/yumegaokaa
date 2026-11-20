import { useEffect, useState } from "react";

/** A transient background read failure must not interrupt an unrelated action. */
export function useDelayedRefreshStatus(failed: boolean) {
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!failed) {
      setWaiting(false);
      return;
    }
    const timer = setTimeout(() => setWaiting(true), 30_000);
    return () => clearTimeout(timer);
  }, [failed]);
  return failed && waiting;
}
