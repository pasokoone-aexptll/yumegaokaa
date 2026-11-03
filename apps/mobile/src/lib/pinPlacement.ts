import { useSyncExternalStore } from "react";
import { updateDraft } from "./pinDraft";
let state: { active: boolean; point?: [number, number]; revision: number } = {
  active: false,
  revision: 0,
};
const listeners = new Set<() => void>();
function set(next: typeof state) {
  state = next;
  listeners.forEach((f) => f());
}
export function beginPinPlacement(point?: [number, number]) {
  set({ active: true, point, revision: state.revision + 1 });
}
export function placePin(point: [number, number]) {
  set({ ...state, point, revision: state.revision + 1 });
}
export function finishPinPlacement() {
  if (!state.point) return;
  updateDraft({ location: state.point });
  set({ ...state, active: false });
}
export function usePinPlacement() {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    () => state,
  );
}
