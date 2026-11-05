import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { entrySheetState, type EntrySheetState } from "../lib/entrySheetState";
/** The route's native detent is configured before presentation, never in onShow. */
export function StreetEntrySheet(props: EntrySheetState) {
  const router = useRouter();
  const opened = useRef(false);
  useEffect(() => {
    entrySheetState.publish(props);
    if (props.sheet && !opened.current) {
      opened.current = true;
      router.push("/street-entry");
    } else if (!props.sheet) opened.current = false;
  }, [props, router]);
  useEffect(
    () => () => {
      entrySheetState.publish(null);
    },
    [],
  );
  return props.sheet !== null ? (
    <BlurView
      pointerEvents="none"
      intensity={25}
      tint="default"
      style={{ position: "absolute", inset: 0 }}
    />
  ) : null;
}
