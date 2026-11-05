import type { useStreetMap } from "../hooks/useStreetMap";
export type EntrySheetState = Pick<
  ReturnType<typeof useStreetMap>,
  "sheet" | "entryError" | "setSheet" | "scan" | "exit"
>;
let current: EntrySheetState | null = null;
const listeners = new Set<() => void>();
export const entrySheetState = {
  get: () => current,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  publish(value: EntrySheetState | null) {
    current = value;
    listeners.forEach((listener) => listener());
  },
  close() {
    const value = current;
    if (!value?.sheet) return;
    if (value.sheet === "success" || value.sheet === "explain")
      value.setSheet(null);
    else void value.exit();
  },
};
