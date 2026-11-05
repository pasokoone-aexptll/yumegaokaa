import { PlacementHandle, type PlacementProjection } from "../pins/PlacementHandle";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

import { StyleSheet, View, Animated, useWindowDimensions } from "react-native";

import { useRef, useImperativeHandle, useEffect, useCallback, useMemo, useState } from "react";
import type { CameraRef as LibreCameraRef, MapRef } from "@maplibre/maplibre-react-native";
// Android/default implementation. Preserve MapLibre for the future Android build.
import {
  Map as LibreMap,
  Camera as LibreCamera,
  Marker as LibreMarker,
  ViewAnnotation,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { mapStyle as defaultStyle } from "../../lib/mapStyle";
import type {
  MapProps,
  CameraProps,
  MarkerProps,
  BoundaryProps,
  ViewState,
} from "./PlatformMap.types";
export type { CameraRef } from "./PlatformMap.types";
const MapPixels = requireNativeViewManager<ViewProps & { blurred: boolean; revision: number }>("PresenceNative", "MapPixels");
export function Map({
  historyBlur = false,
  mapStyle = defaultStyle,
  placement,
  bottomInset = 0,
  onMovingChange,
  ...props
}: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const [backdropRevision, refreshBackdrop] = useState(0);
  const lastProjectionAt = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  const projection = useMemo(() => ({ current: {
    async pointForCoordinate({ longitude, latitude }) {
      const [x, y] = await mapRef.current!.project([longitude, latitude]);
      return { x, y };
    },
    async coordinateForPoint({ x, y }) {
      const [longitude, latitude] = await mapRef.current!.unproject([x, y]);
      return { longitude, latitude };
    },
    async getCamera() { return await mapRef.current!.getViewState(); },
  } satisfies PlacementProjection }), []);
  const { height } = useWindowDimensions();
  const cover = useRef(new Animated.Value(1)).current;
  const revealed = useRef(false);
  const reveal = useCallback(() => {
    if (revealed.current) return;
    revealed.current = true;
    setMapReady(true);
    refreshBackdrop(n => n + 1);
    Animated.timing(cover, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [cover]);
  useEffect(() => {
    const timer = setTimeout(reveal, 3000);
    return () => clearTimeout(timer);
  }, [reveal]);
  const map = (
    <LibreMap
      ref={mapRef}
      onRegionIsChanging={placement ? () => {
        const now = Date.now();
        if (now - lastProjectionAt.current >= 80) {
          lastProjectionAt.current = now;
          setCameraRevision(r => r + 1);
        }
      } : undefined}
      onDidFinishRenderingFrameFully={mapReady ? undefined : reveal}
      onDidFailLoadingMap={reveal}
      contentInset={bottomInset ? undefined : { top: 0, left: 0, right: 0, bottom: 0 }}
      preferredFramesPerSecond={30}
      compass={false}
      androidView="surface"
      mapStyle={mapStyle}
      {...props}
      onRegionWillChange={() => onMovingChange?.(true)}
      onRegionDidChange={() => { refreshBackdrop(n => n + 1); onMovingChange?.(false); if (placement) setCameraRevision(r => r + 1); }}
    />
  );
  return onMovingChange ? (
    <>
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, height }}>
      <MapPixels revision={backdropRevision} blurred={historyBlur} style={StyleSheet.absoluteFill}>{map}</MapPixels>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#303947", opacity: cover }]} />
    </View>
    {placement && <PlacementHandle map={projection} point={placement.point} revision={placement.revision}
      onDrop={placement.onDrop} cameraRevision={cameraRevision} />}
    </>
  ) : map;
}
export function Camera({ ref, ...props }: CameraProps) {
  const camera = useRef<LibreCameraRef>(null);
  useImperativeHandle(ref, () => ({
    flyTo({ detailPadding, ...view }: ViewState) {
      if (detailPadding) {
        // Apply the padded target before the sheet can pause the underlying map.
        camera.current?.jumpTo({ ...view, padding: { top: 0, left: 0, right: 0, bottom: detailPadding } });
      } else {
        camera.current?.flyTo(view);
      }
    },
  }), []);
  return <LibreCamera maxZoom={18} ref={camera} {...props} />;
}
export function Marker({ lngLat, children, draggable, onDragEnd, onPress }: MarkerProps) {
  if (draggable) return (
    <ViewAnnotation lngLat={lngLat} draggable onDragEnd={event => onDragEnd?.(event.nativeEvent.lngLat)}>
      {children}
    </ViewAnnotation>
  );
  return <LibreMarker lngLat={lngLat} onPress={onPress}>{children}</LibreMarker>;
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
