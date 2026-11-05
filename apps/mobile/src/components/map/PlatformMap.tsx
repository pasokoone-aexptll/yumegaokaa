import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
import { BlurTargetView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, Animated } from "react-native";
import { streetMapTarget } from "./streetMapTarget";
import { useRef, useImperativeHandle, useEffect, useCallback } from "react";
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
const MapPixels = requireNativeViewManager<ViewProps & { blurred: boolean }>("PresenceNative", "MapPixels");
export function Map({
  historyBlur = false,
  mapStyle = defaultStyle,
  placement,
  bottomInset: _bottomInset,
  onMovingChange,
  ...props
}: MapProps) {
  const insets = useSafeAreaInsets();
  const cover = useRef(new Animated.Value(1)).current;
  const revealed = useRef(false);
  const reveal = useCallback(() => {
    if (revealed.current) return;
    revealed.current = true;
    Animated.timing(cover, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [cover]);
  useEffect(() => {
    const timer = setTimeout(reveal, 3000);
    return () => clearTimeout(timer);
  }, [reveal]);
  const map = (
    <LibreMap
      onDidFinishRenderingFrameFully={reveal}
      onDidFailLoadingMap={reveal}
      compass={false}
      androidView="texture"
      mapStyle={mapStyle}
      {...props}
      onRegionWillChange={() => onMovingChange?.(true)}
      onRegionDidChange={() => onMovingChange?.(false)}
    />
  );
  return onMovingChange ? (
    <BlurTargetView ref={streetMapTarget} style={[StyleSheet.absoluteFill, { bottom: placement ? 0 : -(48 + insets.bottom) }]}>
      <MapPixels blurred={historyBlur} style={StyleSheet.absoluteFill}>{map}</MapPixels>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#303947", opacity: cover }]} />
    </BlurTargetView>
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
