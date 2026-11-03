import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import type MapView from "react-native-maps";
import { PlacementRing } from "./PlacementRing";
export function ApplePlacementHandle({
  map,
  point,
  revision,
  cameraRevision,
  onDrop,
}: {
  map: React.RefObject<MapView | null>;
  point: [number, number];
  revision: number;
  cameraRevision: number;
  onDrop: (point: [number, number]) => void;
}) {
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ position, onDrop });
  useEffect(() => {
    latest.current = { position, onDrop };
  }, [position, onDrop]);
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
    void map.current
      ?.pointForCoordinate({ longitude: point[0], latitude: point[1] })
      .then((p) => {
        if (
          mounted.current &&
          !draggingRef.current &&
          sequence > appliedSequence.current
        ) {
          appliedSequence.current = sequence;
          setPosition(p);
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
        },
        onPanResponderMove: (_, g) => {
          const p = { x: origin.current.x + g.dx, y: origin.current.y + g.dy };
          moved.current = p;
          setPosition(p);
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
            });
        },
        onPanResponderTerminate: () => {
          draggingRef.current = false;
          setPosition(origin.current);
          setDragging(false);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [map],
  );
  if (!position) return null;
  return (
    <View
      {...pan.panHandlers}
      accessibilityLabel="ピンをドラッグして場所を調整"
      style={{
        position: "absolute",
        left: position.x - 40,
        top: position.y - 32.5,
        width: 80,
        height: 65,
      }}
    >
      <PlacementRing revision={revision} dragging={dragging} />
    </View>
  );
}
