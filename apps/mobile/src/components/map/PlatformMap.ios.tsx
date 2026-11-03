import { View } from "react-native";
import { ApplePlacementHandle } from "../pins/ApplePlacementHandle";
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
export function Map({ children, style, onPress, placement }: MapProps) {
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  return (
    <Context.Provider value={{ map, ready }}>
      <View style={style}>
        <MapView
          ref={map}
          style={{ flex: 1 }}
          userInterfaceStyle="dark"
          mapType="standard"
          showsBuildings
          pitchEnabled
          rotateEnabled
          showsUserLocation={false}
          initialCamera={appleCamera({
            center: [139.7109, 35.7295],
            zoom: 17,
            pitch: 55,
          })}
          onRegionChangeComplete={() => setCameraRevision((r) => r + 1)}
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
        </MapView>
        {ready && placement && (
          <ApplePlacementHandle
            map={map}
            point={placement.point}
            revision={placement.revision}
            onDrop={placement.onDrop}
            cameraRevision={cameraRevision}
          />
        )}
      </View>
    </Context.Provider>
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
  onDragEnd,
}: MarkerProps) {
  return (
    <AppleMarker
      coordinate={{ longitude: lngLat[0], latitude: lngLat[1] }}
      draggable={draggable}
      onDragEnd={(e) =>
        onDragEnd?.([
          e.nativeEvent.coordinate.longitude,
          e.nativeEvent.coordinate.latitude,
        ])
      }
      tracksViewChanges
    >
      {children}
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
      strokeColor="#008cff"
      strokeWidth={3}
    />
  );
}
