import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Map, Marker } from "./map/PlatformMap";
import { mapStyle } from "../lib/mapStyle";
import { Action } from "./Page";
export function LocationPicker({
  initial,
  onConfirm,
  onCancel,
}: {
  initial?: [number, number];
  onConfirm: (point: [number, number]) => void;
  onCancel: () => void;
}) {
  const [point, setPoint] = useState(initial);
  return (
    <View style={{ flex: 1 }}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        onPress={(e) => setPoint(e.nativeEvent.lngLat)}
      >
        <Camera
          initialViewState={{ center: point ?? [139.7109, 35.7295], zoom: 15 }}
        />
        {point && (
          <Marker lngLat={point}>
            <Text style={{ fontSize: 40, color: "#ff4c81" }}>●</Text>
          </Marker>
        )}
      </Map>
      <SafeAreaView
        pointerEvents="box-none"
        style={{ flex: 1, padding: 24, justifyContent: "space-between" }}
      >
        <Action title="戻る" onPress={onCancel} />
        <Action
          title="この場所にする"
          disabled={!point}
          onPress={() => {
            if (point) onConfirm(point);
          }}
        />
      </SafeAreaView>
    </View>
  );
}
