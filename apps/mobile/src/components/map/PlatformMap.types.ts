import type { ReactNode, ReactElement, Ref } from "react";
import type { StyleProp, ViewStyle } from "react-native";
export type ViewState = {
  center: [number, number];
  zoom?: number;
  pitch?: number;
  duration?: number;
};
export type CameraRef = { flyTo: (view: ViewState) => void };
export type CameraProps = { initialViewState: ViewState; ref?: Ref<CameraRef> };
export type MapProps = {
  placement?: {
    point: [number, number];
    revision: number;
    onDrop: (point: [number, number]) => void;
  };
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  mapStyle?: string;
  onPress?: (event: { nativeEvent: { lngLat: [number, number] } }) => void;
};
export type MarkerProps = {
  lngLat: [number, number];
  children: ReactElement;
  draggable?: boolean;
  onDragEnd?: (point: [number, number]) => void;
};
export type BoundaryProps = { data: GeoJSON.Polygon };
