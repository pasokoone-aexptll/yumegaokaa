/** Reserve the measured +total label only when some icons cannot fit. */
export function visiblePresenceIcons(
  total: number,
  width: number,
  badgeWidth: number,
  iconSize = 34,
  gap = 4,
) {
  if (width <= 0 || total <= 0) return 0;
  const allFit = Math.floor((width + gap) / (iconSize + gap));
  if (allFit >= total) return total;
  if (badgeWidth <= 0) return 0;
  return Math.max(
    0,
    Math.min(total, Math.floor((width - badgeWidth) / (iconSize + gap))),
  );
}

/** Only the visit-based header expires here; map cells keep their ten-minute rule. */
export function liveHeaderIcons(
  groups: { expires_at: string; icons: (string | null)[] }[] | undefined,
  now: number,
) {
  return (groups ?? [])
    .filter((group) => Date.parse(group.expires_at) > now)
    .flatMap((group) => group.icons);
}
