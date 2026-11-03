import { useEffect, useRef, useState } from "react";
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
  const origin = useRef({ x:0,y:0 });
  const moved = useRef({ x:0,y:0 });
  useEffect(() => {
    let live = true;
    void map.current
      ?.pointForCoordinate({ longitude: point[0], latitude: point[1] })
      .then((p) => {
        if (live) setPosition(p);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [point, map, cameraRevision]);
  // Callbacks read refs only during touch events; PanResponder does not invoke them here.
  // eslint-disable-next-line react-hooks/refs
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      origin.current = position ?? { x: 0, y: 0 };
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
          onDrop([c.longitude, c.latitude]);
        })
        .catch(() => setPosition(origin.current))
        .finally(() => setDragging(false));
    },
    onPanResponderTerminate: () => {
      setPosition(origin.current);
      setDragging(false);
    },
    onPanResponderTerminationRequest: () => false,
  });
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
