import { BlurTargetView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { streetMapTarget } from "./streetMapTarget";
import { useRef, useImperativeHandle } from "react";
import type { CameraRef as LibreCameraRef } from "@maplibre/maplibre-react-native";
// Android/default implementation. Preserve MapLibre for the future Android build.
import {
  Map as LibreMap,
  Camera as LibreCamera,
  Marker as LibreMarker,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { mapStyle as defaultStyle } from "../../lib/mapStyle";
import type {
  MapProps,
  CameraProps,
  MarkerProps,
  BoundaryProps,
} from "./PlatformMap.types";
export type { CameraRef } from "./PlatformMap.types";
export function Map({
  mapStyle = defaultStyle,
  placement,
  bottomInset: _bottomInset,
  onMovingChange,
  ...props
}: MapProps) {
  const insets = useSafeAreaInsets();
  const map = (
    <LibreMap
      compass={false}
      androidView="texture"
      mapStyle={mapStyle}
      {...props}
      onRegionWillChange={() => onMovingChange?.(true)}
      onRegionDidChange={() => onMovingChange?.(false)}
    />
  );
  return onMovingChange ? (
    <BlurTargetView ref={streetMapTarget} style={[StyleSheet.absoluteFill, { bottom: placement ? 0 : -(48 + insets.bottom) }]}>{map}</BlurTargetView>
  ) : map;
}
export function Camera({ ref, ...props }: CameraProps) {
  const camera = useRef<LibreCameraRef>(null);
  useImperativeHandle(
    ref,
    () => ({
      flyTo: (view) => {
        void camera.current?.flyTo(view);
      },
    }),
    [],
  );
  return <LibreCamera maxZoom={18} ref={camera} {...props} />;
}
export function Marker({ lngLat, children }: MarkerProps) {
  // MapLibre Marker does not expose native dragging; retain tap placement on Android.
  return <LibreMarker lngLat={lngLat}>{children}</LibreMarker>;
}
export function Boundary({ data }: BoundaryProps) {
  return (
    <GeoJSONSource id="area-preview" data={data}>
      <Layer
        id="area-fill"
        type="fill"
        paint={{ "fill-color": "#008cff", "fill-opacity": 0.2 }}
      />
      <Layer
        id="area-border"
        type="line"
        paint={{ "line-color": "#008cff", "line-width": 3 }}
      />
    </GeoJSONSource>
  );
}
