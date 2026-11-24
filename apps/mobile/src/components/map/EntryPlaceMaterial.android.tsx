import { requireNativeViewManager } from "expo-modules-core";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, type ViewProps } from "react-native";
import { MapProjection } from "./MapProjection";
const Material = requireNativeViewManager<
  ViewProps & {
    point: number[];
  }
>("PresenceNative", "MarkerBackdrop");
export function EntryPlaceMaterial({
  coordinate,
}: {
  coordinate: [number, number];
}) {
  const projection = useContext(MapProjection);
  const [point, setPoint] = useState<number[]>([]);
  const [longitude, latitude] = coordinate;
  useEffect(() => {
    let live = true;
    void projection
      ?.project([longitude, latitude])
      .then((value) => {
        if (live) {
          setPoint(value);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [longitude, latitude, projection]);
  return (
    <Material
      pointerEvents="none"
      point={point}
      style={[StyleSheet.absoluteFill, { width: 40, height: 40 }]}
    />
  );
}
