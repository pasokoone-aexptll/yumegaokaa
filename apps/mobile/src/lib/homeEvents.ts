import type { StreetEvent } from "./events";
export function homeEvents(items: StreetEvent[]) {
  const sorted = [...items].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );
  return {
    joined: sorted.filter((item) => item.joined),
    discover: sorted.filter((item) => !item.joined),
  };
}
