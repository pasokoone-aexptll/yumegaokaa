import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { native, streetID } from "../lib/native";
export type AccessStatus =
  | "pool_required"
  | "profile_required"
  | "unknown"
  | "active"
  | "unregistered"
  | "suspended"
  | "withdrawn"
  | "expired";
export const AccountAccessContext = createContext({
  status: "unknown" as AccessStatus,
  retry: () => {},
});
export function useAccountAccess(signed: boolean, revision: number) {
  const [access, setAccess] = useState<{
    revision: number;
    status: AccessStatus;
  }>({ revision: -1, status: "unknown" });
  const generation = useRef(0);
  const inFlight = useRef(false);
  const refresh = useCallback(async () => {
    if (!signed || inFlight.current) return;
    inFlight.current = true;
    const gen = generation.current;
    try {
      const result = await native.rpc<{ status: AccessStatus }>(
        "account_access",
        {},
      );
      let status = result.status;
      if (status === "active") {
        const profile = await native.rpc<{ display_name: string }>(
          "profile_get",
          {},
        );
        if (!profile.display_name.trim()) status = "profile_required";
        else {
          const pool = await native.rpc<{ contributed: boolean }>(
            "street_icon_get",
            { street_id: streetID },
          );
          if (!pool.contributed) status = "pool_required";
        }
      }
      if (gen === generation.current) {
        setAccess({ revision, status });
        if (result.status === "suspended" || result.status === "withdrawn")
          void native.stop().catch(() => {});
      }
    } catch (e) {
      if (gen !== generation.current) return;
      if (String(e).includes("login_required")) {
        await native.session();
        return;
      }
      if (
        /unauthorized|refresh_token_not_found|refresh_token_already_used/.test(
          String(e),
        )
      ) {
        setAccess({ revision, status: "expired" });
        await native.logout();
      }
    } finally {
      inFlight.current = false;
    }
  }, [signed, revision]);
  useEffect(() => {
    const lifecycle = generation;
    lifecycle.current++;
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 10000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      lifecycle.current++;
      clearTimeout(initial);
      clearInterval(timer);
      sub.remove();
    };
  }, [revision, refresh]);
  return {
    status:
      access.revision === revision
        ? access.status
        : ("unknown" as AccessStatus),
    retry: () => {
      void refresh();
    },
  };
}
