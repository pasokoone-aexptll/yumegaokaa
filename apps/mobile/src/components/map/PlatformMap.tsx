import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";
import { PlacementHandle, type PlacementProjection } from "../pins/PlacementHandle";
import { MarkerScale, RefreshMarker, useMarkerScale } from "./markerScale";


import { StyleSheet, View, Animated, useWindowDimensions } from "react-native";

import { useRef, useContext, useImperativeHandle, useEffect, useCallback, useMemo, useState } from "react";
import type { CameraRef as LibreCameraRef, ViewAnnotationRef, MapRef } from "@maplibre/maplibre-react-native";
// Android/default implementation. Preserve MapLibre for the future Android build.
import {
  Map as LibreMap,
  Camera as LibreCamera,
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
const HistoryBlur = requireNativeViewManager<ViewProps>("PresenceNative", "HistoryBlur");
export function Map({
  historyBlur = false,
  mapStyle = defaultStyle,
  placement,
  bottomInset = 0,
  onMovingChange,
  onMapReady,
  ...props
}: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const [scale, updateZoom] = useMarkerScale();
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
    Animated.timing(cover, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [cover]);
  useEffect(() => {
    const timer = setTimeout(reveal, 3000);
    return () => clearTimeout(timer);
  }, [reveal]);
  const map = (
    <LibreMap
      ref={mapRef}
      onRegionIsChanging={event => {
        updateZoom(event.nativeEvent.zoom);
        const now = Date.now();
        if (placement && now - lastProjectionAt.current >= 80) {
          lastProjectionAt.current = now;
          setCameraRevision(r => r + 1);
        }
      }}
      onDidFinishLoadingMap={onMapReady}
      onDidFinishRenderingFrameFully={mapReady ? undefined : reveal}
      onDidFailLoadingMap={reveal}
      contentInset={bottomInset ? undefined : { top: 0, left: 0, right: 0, bottom: 0 }}
      preferredFramesPerSecond={30}
      compass={false}
      androidView="surface"
      mapStyle={mapStyle}
      {...props}
      onRegionWillChange={() => onMovingChange?.(true)}
      onRegionDidChange={event => { updateZoom(event.nativeEvent.zoom); onMovingChange?.(false); if (placement) setCameraRevision(r => r + 1); }}
    />
  );
  return onMovingChange ? (
    <>
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, height }}>
      <MarkerScale.Provider value={scale}>{map}</MarkerScale.Provider>
      {historyBlur && <HistoryBlur pointerEvents="none" style={StyleSheet.absoluteFill} />}
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
        return camera.current?.setStop({ ...view, duration: 0, padding: { top: 0, left: 0, right: 0, bottom: detailPadding } });
      } else {
        camera.current?.flyTo(view);
      }
    },
  }), []);
  return <LibreCamera maxZoom={18} ref={camera} {...props} />;
}
export function Marker({ lngLat, children, draggable, onDragEnd, onPress, snapshotKey }: MarkerProps) {
  const ref = useRef<ViewAnnotationRef>(null);
  const frame = useRef<number | null>(null);
  const scale = useContext(MarkerScale);
  const refresh = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      ref.current?.refresh();
    });
  }, []);
  useEffect(() => {
    refresh();
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [scale, snapshotKey, refresh]);
  return (
    <ViewAnnotation ref={ref} lngLat={lngLat} draggable={draggable} onPress={onPress}
      onDragEnd={event => onDragEnd?.(event.nativeEvent.lngLat)}>
      <View collapsable={false} onLayout={refresh}>
        <RefreshMarker.Provider value={refresh}>
          <View collapsable={false} style={{ transform: [{ scale }] }}>{children}</View>
        </RefreshMarker.Provider>
      </View>
    </ViewAnnotation>
  );
}
export function Boundary({ data }: BoundaryProps) {
  return (
    <GeoJSONSource id="area-preview" data={data}>
      <Layer
        beforeId={process.env.EXPO_PUBLIC_MAP_STYLE_URL ? undefined : "place_country_major"}
        id="area-fill"
        type="fill"
        paint={{ "fill-color": "#008cff", "fill-opacity": 0.2 }}
      />
      <Layer
        beforeId={process.env.EXPO_PUBLIC_MAP_STYLE_URL ? undefined : "place_country_major"}
        id="area-border"
        type="line"
        paint={{ "line-color": "#ffffff", "line-opacity": 0.65, "line-width": 2 }}
      />
    </GeoJSONSource>
  );
}
