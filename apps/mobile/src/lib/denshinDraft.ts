import { useEffect, useState } from "react";
import type { DenshinPin } from "./denshin";
export type DenshinDraft = {
  id?: string;
  revision?: number;
  body: string;
  recruiting: boolean;
  limited: boolean;
  capacity: number;
  location?: [number, number];
  original?: DenshinPin;
};
const empty = (): DenshinDraft => ({
  body: "",
  recruiting: false,
  limited: false,
  capacity: 12,
});
let value = empty();
const listeners = new Set<() => void>();
export function updateDenshinDraft(patch: Partial<DenshinDraft>) {
  value = { ...value, ...patch };
  listeners.forEach((f) => f());
}
export function clearDenshinDraft() {
  value = empty();
  listeners.forEach((f) => f());
}
export function editDenshin(pin: DenshinPin) {
  value = {
    id: pin.id,
    revision: pin.revision,
    body: pin.body,
    recruiting: pin.recruiting,
    limited: pin.capacity !== null,
    capacity: pin.capacity ?? 12,
    location: [pin.longitude, pin.latitude],
    original: pin,
  };
  listeners.forEach((f) => f());
}
export function useDenshinDraft() {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    const refresh = () => setDraft(value);
    listeners.add(refresh);
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);
  return draft;
}
