import dark3D from "../../assets/maps/dark-3d.json";
// OpenFreeMap Dark with Liberty's building extrusion definition. Keep attribution.
// Stored locally so style availability does not add a startup request; tiles remain online.
export const mapStyle =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? JSON.stringify(dark3D);
