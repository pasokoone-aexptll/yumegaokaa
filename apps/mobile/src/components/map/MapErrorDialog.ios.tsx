import { useEffect, useRef } from "react";
import { Alert } from "react-native";

/** Acknowledging an error does not alter visit state or silently retry a write. */
export function MapErrorDialog({ message }: { message: string }) {
  const shown = useRef<string | null>(null);
  useEffect(() => {
    if (!message || shown.current === message) return;
    shown.current = message;
    Alert.alert("通信エラー", message, [{ text: "OK" }]);
  }, [message]);
  return null;
}
