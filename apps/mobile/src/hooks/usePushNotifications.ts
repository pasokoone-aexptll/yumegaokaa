import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import { native } from "../lib/native";

export function usePushLifecycle(active: boolean, revision: number) {
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    const refresh = async () => {
      try {
        await native.pushSync(false);
        if (!disposed && (await native.pushOpen()))
          router.push("/notifications");
      } catch {
        /* The authenticated inbox remains available without push. */
      }
    };
    void refresh();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    // A notification tap can arrive just after the foreground callback.
    const timer = setInterval(() => {
      if (AppState.currentState === "active")
        void native
          .pushOpen()
          .then((open) => {
            if (open && !disposed) router.push("/notifications");
          })
          .catch(() => {});
    }, 1000);
    return () => {
      disposed = true;
      listener.remove();
      clearInterval(timer);
    };
  }, [active, revision]);
}

export function usePushPermission() {
  const [status, setStatus] = useState("disabled");
  useEffect(() => {
    let disposed = false;
    const refresh = () =>
      void native
        .pushStatus()
        .then((value) => {
          if (!disposed) setStatus(value);
        })
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 1000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, []);
  const enable = async () => {
    setStatus("registering");
    try {
      setStatus(await native.pushSync(true));
    } catch {
      setStatus("error");
    }
  };
  return { status, enable };
}
