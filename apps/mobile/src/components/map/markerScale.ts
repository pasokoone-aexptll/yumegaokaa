import { createContext, useCallback, useRef, useState } from "react";

export const MarkerScale = createContext(1);
export const RefreshMarker = createContext<(() => void) | undefined>(undefined);

// Magnification doubles per zoom level. The reciprocal term flattens both
// ends of the curve: 36% at street-region overview, 100% by zoom 18.
export function scaleAtZoom(zoom: number) {
  const m = 2 ** (Math.min(18, zoom) - 15);
  return 0.36 + 0.64 * (m / (1 + m)) / (8 / 9);
}

export function useMarkerScale() {
  const [scale, setScale] = useState(() => scaleAtZoom(17));
  const current = useRef(scale);
  const update = useCallback((zoom: number) => {
    if (!Number.isFinite(zoom)) return;
    const next = Math.round(scaleAtZoom(zoom) * 100) / 100;
    if (next !== current.current) {
      current.current = next;
      setScale(next);
    }
  }, []);
  return [scale, update] as const;
}
