// Free public tiles; keep attribution visible. No offline prefetch is enabled.
// Provider choice can be changed without touching map/presence state.
export const mapStyle =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/positron";
