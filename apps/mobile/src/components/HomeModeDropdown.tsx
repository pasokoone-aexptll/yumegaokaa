import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { native, type NativeState } from "../lib/native";
import { ModeDropdown } from "./map/ModeDropdown";

export function HomeModeDropdown() {
  const [state, setState] = useState<NativeState>();
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void native
        .resume()
        .then((value) => {
          if (live) setState(value);
        })
        .catch(() => {});
      const subscription = native.addListener("onChange", (value) => {
        if (live) setState(value);
      });
      return () => {
        live = false;
        subscription.remove();
      };
    }, []),
  );
  async function change(ghost: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      setState(await native.setGhost(ghost));
    } catch {
      Alert.alert(
        "設定を変更できませんでした",
        "しばらくしてから、もう一度お試しください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <ModeDropdown
      dark={false}
      ghost={state?.visit.ghost ?? state?.ghost_preference ?? false}
      active={state?.visit.state === "active"}
      disabled={!state || busy}
      onChange={(value) => void change(value)}
    />
  );
}
