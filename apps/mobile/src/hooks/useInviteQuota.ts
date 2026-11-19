import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
export function useInviteQuota() {
  const [remaining, setRemaining] = useState<number>();
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void native
        .rpc<{ remaining?: number }>("invite_list", {})
        .then((result) => {
          if (live) setRemaining(result.remaining);
        })
        .catch(() => {
          if (live) setRemaining(undefined);
        });
      return () => {
        live = false;
      };
    }, []),
  );
  return remaining;
}
