import type { StreetEvent } from "./events";
export type EventEditDraft = {
  id: string;
  event: StreetEvent;
  title: string;
  description: string;
  start: string;
  end: string;
  capacity: string;
  point?: [number, number];
  ongoing: boolean;
  latest?: StreetEvent;
};
// One in-memory round trip, never a saved server edit. Cleared on session changes.
let draft: EventEditDraft | undefined;
export function preserveEventEdit(value: EventEditDraft) {
  draft = value;
}
export function readEventEdit(id: string) {
  return draft?.id === id ? draft : undefined;
}
export function takeEventEdit(id: string) {
  if (draft?.id !== id) return undefined;
  const value = draft;
  draft = undefined;
  return value;
}
export function setEventEditLocation(id: string, point: [number, number]) {
  if (draft?.id !== id) return false;
  draft = { ...draft, point };
  return true;
}
export function clearEventEdit() {
  draft = undefined;
}
