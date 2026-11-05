import { setEventEditLocation } from "./eventEditDraft";
import { useSyncExternalStore } from "react";
import { updateDraft } from "./pinDraft";
let state: {
  active: boolean;
  eventId?: string;
  point?: [number, number];
  revision: number;
} = {
  active: false,
  revision: 0,
};
const listeners = new Set<() => void>();
function set(next: typeof state) {
  state = next;
  listeners.forEach((f) => f());
}
export function beginPinPlacement(point?: [number, number], eventId?: string) {
  set({ active: true, point, eventId, revision: state.revision + 1 });
}
export function placePin(point: [number, number]) {
  set({ ...state, point, revision: state.revision + 1 });
}
export function cancelPinPlacement() {
  set({ ...state, active: false });
}
export function finishPinPlacement() {
  if (!state.active || !state.point) return;
  const eventId = state.eventId;
  if (eventId) {
    if (!setEventEditLocation(eventId, state.point)) {
      cancelPinPlacement();
      return;
    }
  } else updateDraft({ location: state.point });
  set({ ...state, active: false });
  return eventId
    ? { kind: "edit" as const, id: eventId }
    : { kind: "create" as const };
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
