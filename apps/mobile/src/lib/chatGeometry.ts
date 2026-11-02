/** Keyboard moves the viewport; it must never change content padding or its size. */
export function chatGeometry(
  height: number,
  available: number,
  footer: number,
  keyboard: number,
) {
  const collapsed = Math.max(footer, Math.min(height * 0.36, available));
  const expanded = Math.max(footer, Math.min(height * 0.74, available));
  return {
    viewport: Math.max(0, expanded - footer),
    topPadding: expanded - collapsed,
    collapsed: Math.max(footer, Math.min(collapsed, available - keyboard)),
    expanded: Math.max(footer, Math.min(expanded, available - keyboard)),
  };
}
