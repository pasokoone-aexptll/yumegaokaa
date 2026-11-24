import { MarkerScale } from "../map/markerScale";
import {
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PanResponder, View } from "react-native";
import { PlacementPreviewMotion } from "./PlacementPreviewMotion";
import { PlacementRing } from "./PlacementRing";
type Coordinate = { longitude: number; latitude: number };
type Pixel = { x: number; y: number };
export type PlacementProjection = {
  pointForCoordinate(coordinate: Coordinate): Promise<Pixel>;
  coordinateForPoint(point: Pixel): Promise<Coordinate>;
  getCamera(): Promise<{ pitch: number }>;
};
export function PlacementHandle({
  map,
  point,
  revision,
  cameraRevision,
  onDrop,
  preview,
  active = true,
  previewOnMap = false,
  previewGroundOffset = 0,
  onDragChange,
}: {
  preview?: ReactNode;
  previewOnMap?: boolean;
  previewGroundOffset?: number;
  onDragChange?: (offset: Pixel | null) => void;
  active?: boolean;
  map: React.RefObject<PlacementProjection | null>;
  point: [number, number];
  revision: number;
  cameraRevision: number;
  onDrop: (point: [number, number]) => void;
}) {
  const scale = useContext(MarkerScale);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const [pitch, setPitch] = useState(45);
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ position, onDrop, onDragChange });
  useEffect(() => {
    latest.current = { position, onDrop, onDragChange };
  }, [position, onDrop, onDragChange]);
  const draggingRef = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const moved = useRef({ x: 0, y: 0 });
  const projectionSequence = useRef(0);
  const appliedSequence = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const sequence = ++projectionSequence.current;
    const currentMap = map.current;
    if (!currentMap) return;
    void Promise.all([
      currentMap.pointForCoordinate({
        longitude: point[0],
        latitude: point[1],
      }),
      currentMap.getCamera(),
    ])
      .then(([p, camera]) => {
        if (
          mounted.current &&
          !draggingRef.current &&
          sequence > appliedSequence.current
        ) {
          appliedSequence.current = sequence;
          setPosition(p);
          setPitch(camera.pitch);
        }
      })
      .catch(() => {});
  }, [point, map, cameraRevision]);
  // Callbacks read refs only during touch events; PanResponder does not invoke them here.
  const pan = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- Event callbacks are invoked only by gestures.
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          draggingRef.current = true;
          origin.current = latest.current.position ?? { x: 0, y: 0 };
          moved.current = origin.current;
          setDragging(true);
          latest.current.onDragChange?.({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, g) => {
          const p = { x: origin.current.x + g.dx, y: origin.current.y + g.dy };
          moved.current = p;
          setPosition(p);
          latest.current.onDragChange?.({ x: g.dx, y: g.dy });
        },
        onPanResponderRelease: () => {
          void map.current
            ?.coordinateForPoint(moved.current)
            .then((c) => {
              latest.current.onDrop([c.longitude, c.latitude]);
            })
            .catch(() => setPosition(origin.current))
            .finally(() => {
              draggingRef.current = false;
              setDragging(false);
              latest.current.onDragChange?.(null);
            });
        },
        onPanResponderTerminate: () => {
          draggingRef.current = false;
          setPosition(origin.current);
          setDragging(false);
          latest.current.onDragChange?.(null);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [map],
  );
  if (!position) return null;
  const groundOffset = previewOnMap
    ? previewGroundOffset
    : preview
      ? (previewHeight / 2 - 16.5) * scale
      : 0;
  return (
    <View
      collapsable={false}
      hitSlop={12}
      {...(active ? pan.panHandlers : {})}
      pointerEvents={active ? "auto" : "none"}
      accessibilityLabel="ピンをドラッグして場所を調整"
      style={{
        position: "absolute",
        left: position.x - 40,
        top: position.y - 32.5 + groundOffset,
        width: 80,
        height: 65,
      }}
    >
      {preview && !previewOnMap && (
        <View
          pointerEvents="none"
          onLayout={(event) =>
            setPreviewHeight(event.nativeEvent.layout.height)
          }
          style={{
            position: "absolute",
            // Apple custom annotations are centered on the projected coordinate.
            // The preview uses that same center, size and zoom scale.
            top: 32.5 - groundOffset - previewHeight / 2,
            left: -70,
            width: 220,
            alignItems: "center",
            transform: [{ scale }],
          }}
        >
          <PlacementPreviewMotion
            revision={revision}
            active={active}
            pitch={pitch}
            dragging={dragging}
          >
            {preview}
          </PlacementPreviewMotion>
        </View>
      )}
      {active && !preview && (
        <PlacementRing
          revision={revision}
          dragging={dragging}
          pitch={pitch}
          showPin={!preview}
        />
      )}
    </View>
  );
}
