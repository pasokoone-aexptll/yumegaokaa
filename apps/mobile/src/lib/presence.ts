import type { Snapshot } from "./native";
export function splitCount(count: number): number[] {
  const result: number[] = [];
  while (count > 6) {
    result.push(5);
    count -= 5;
  }
  if (count > 0) result.push(count);
  return result;
}
export function liveCells(snapshot: Snapshot, now: number) {
  return snapshot.cells.flatMap((c) => {
    const groups = c.expiry_groups.filter(
      (g) => Date.parse(g.expires_at) > now,
    );
    const count = groups.reduce((n, g) => n + g.count, 0);
    if (!count) return [];
    // Each display slot fades on its own deadline; a newcomer cannot brighten others.
    const slots = groups.flatMap((g) =>
      Array.from({ length: g.count }, (_, i) => ({
        opacity: Math.max(
          0,
          Math.min(1, (Date.parse(g.expires_at) - now) / 600000),
        ),
        icon: g.icons?.[i] ?? null,
      })),
    );
    let offset = 0;
    const clusters = splitCount(count).map((size) => {
      const group = slots.slice(offset, offset + size);
      const opacities = group.map((slot) => slot.opacity);
      const icons = group.map((slot) => slot.icon);
      offset += size;
      return { count: size, opacities, icons };
    });
    return [{ ...c, count, clusters }];
  });
}
