import { inReview } from "../../lib/native";
import { PlacementPreviewMotion } from "../pins/PlacementPreviewMotion";
import { MarkerScale, useMarkerScale } from "./markerScale";
import { AppState, View, useWindowDimensions } from "react-native";
import { PlacementHandle } from "../pins/PlacementHandle";
import {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import MapView, { Marker as AppleMarker, Polygon } from "react-native-maps";
import type {
  MapProps,
  CameraProps,
  MarkerProps,
  BoundaryProps,
  ViewState,
} from "./PlatformMap.types";
export type { CameraRef } from "./PlatformMap.types";
const Context = createContext<{
  map: React.RefObject<MapView | null>;
  ready: boolean;
} | null>(null);
function appleCamera(view: ViewState) {
  return {
    center: { longitude: view.center[0], latitude: view.center[1] },
    pitch: view.pitch ?? 55,
    heading: 0,
    altitude: 1200 * Math.pow(2, 16 - (view.zoom ?? 16)),
  };
}
export function Map({
  children,
  style,
  onPress,
  onMovingChange,
  placement,
  bottomInset = 0,
  showUserLocation = false,
}: MapProps) {
  const map = useRef<MapView>(null);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => sub.remove();
  }, []);
  const { width } = useWindowDimensions();
  const [scale, updateZoom] = useMarkerScale();
  const regionZoom = (longitudeDelta: number) => {
    if (longitudeDelta > 0)
      updateZoom(Math.log2((360 * width) / (256 * longitudeDelta)));
  };
  const [ready, setReady] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [previewPitch, setPreviewPitch] = useState(55);
  const [placementDrag, setPlacementDrag] = useState<{
    x: number;
    y: number;
  } | null>(null);
  return (
    <MarkerScale.Provider value={scale}>
      <Context.Provider value={{ map, ready }}>
        <View style={style}>
          <MapView
            mapPadding={{ top: 0, right: 0, bottom: bottomInset, left: 0 }}
            ref={map}
            style={{ flex: 1 }}
            userInterfaceStyle="dark"
            mapType="standard"
            showsBuildings
            pitchEnabled
            rotateEnabled
            showsUserLocation={showUserLocation && foreground}
            userLocationCalloutEnabled={false}
            tintColor="#005EFF"
            initialCamera={appleCamera({
              center: inReview() ? [139.8333333, 36] : [139.7109, 35.7295],
              zoom: 17,
              pitch: 55,
            })}
            onRegionChange={(region) => {
              regionZoom(region.longitudeDelta);
              onMovingChange?.(true);
              if (placement) setCameraRevision((r) => r + 1);
            }}
            onRegionChangeComplete={(region) => {
              if (placement)
                void map.current
                  ?.getCamera()
                  .then((camera) => setPreviewPitch(camera.pitch))
                  .catch(() => {});
              regionZoom(region.longitudeDelta);
              onMovingChange?.(false);
              if (placement) setCameraRevision((r) => r + 1);
            }}
            onMapReady={() => setReady(true)}
            onPress={(event) =>
              onPress?.({
                nativeEvent: {
                  lngLat: [
                    event.nativeEvent.coordinate.longitude,
                    event.nativeEvent.coordinate.latitude,
                  ],
                },
              })
            }
          >
            {children}
            {placement?.preview && (
              <Marker lngLat={placement.point} passive>
                <View
                  style={{
                    transform: [
                      { translateX: (placementDrag?.x ?? 0) / scale },
                      { translateY: (placementDrag?.y ?? 0) / scale },
                    ],
                  }}
                >
                  <PlacementPreviewMotion
                    revision={placement.revision}
                    onHeight={setPreviewHeight}
                    pitch={previewPitch}
                    dragging={placementDrag !== null}
                    active={placement.active ?? true}
                  >
                    {placement.preview}
                  </PlacementPreviewMotion>
                </View>
              </Marker>
            )}
          </MapView>
          {ready && placement && (
            <PlacementHandle
              map={map}
              point={placement.point}
              revision={placement.revision}
              preview={placement.preview}
              previewOnMap
              onDragChange={setPlacementDrag}
              previewGroundOffset={(previewHeight / 2 - 16.5) * scale}
              active={placement.active}
              onDrop={placement.onDrop}
              cameraRevision={cameraRevision}
            />
          )}
        </View>
      </Context.Provider>
    </MarkerScale.Provider>
  );
}
export function Camera({ initialViewState, ref }: CameraProps) {
  const context = useContext(Context);
  const [pending, setPending] = useState(initialViewState);
  useImperativeHandle(
    ref,
    () => ({
      flyTo(view: ViewState) {
        setPending(view);
      },
    }),
    [],
  );
  useEffect(() => {
    if (context?.ready)
      context.map.current?.animateCamera(appleCamera(pending), {
        duration: pending.duration ?? 0,
      });
  }, [context?.ready, context?.map, pending]);
  return null;
}
export function Marker({
  lngLat,
  children,
  draggable,
  passive = false,
  onDragEnd,
  onPress,
}: MarkerProps) {
  const scale = useContext(MarkerScale);
  return (
    <AppleMarker
      coordinate={{ longitude: lngLat[0], latitude: lngLat[1] }}
      stopPropagation={passive}
      onPress={passive ? () => {} : onPress}
      draggable={draggable}
      onDragEnd={(e) =>
        onDragEnd?.([
          e.nativeEvent.coordinate.longitude,
          e.nativeEvent.coordinate.latitude,
        ])
      }
      tracksViewChanges
    >
      <View style={{ transform: [{ scale }] }}>{children}</View>
    </AppleMarker>
  );
}
export function Boundary({ data }: BoundaryProps) {
  const coordinates = (ring: number[][]) =>
    ring.map(([longitude, latitude]) => ({ longitude, latitude }));
  return (
    <Polygon
      coordinates={coordinates(data.coordinates[0])}
      holes={data.coordinates.slice(1).map(coordinates)}
      fillColor="#008cff33"
      strokeColor="#ffffffa6"
      strokeWidth={2}
    />
  );
}
