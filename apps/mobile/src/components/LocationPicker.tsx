import { PinButton } from "./pins/PinButton";
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
  pinCreation = false,
}: {
  pinCreation?: boolean;
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
            {pinCreation ? (
              <View
                style={{
                  width: 44,
                  height: 28,
                  borderWidth: 3,
                  borderColor: "#ffffffaa",
                  borderRadius: 24,
                  backgroundColor: "#ffffff33",
                }}
              />
            ) : (
              <Text style={{ fontSize: 40, color: "#ff4c81" }}>●</Text>
            )}
          </Marker>
        )}
      </Map>
      {pinCreation ? (
        <>
          <SafeAreaView
            pointerEvents="box-none"
            style={{ position: "absolute", top: 0, left: 20 }}
          >
            <Action title="戻る" onPress={onCancel} />
          </SafeAreaView>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 8,
              right: 8,
              backgroundColor: "white",
              borderRadius: 32,
              borderCurve: "continuous",
              padding: 24,
              paddingBottom: 32,
              gap: 16,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 56,
                height: 4,
                borderRadius: 3,
                backgroundColor: "#00000033",
                marginTop: -16,
              }}
            />
            <Text
              style={{
                textAlign: "center",
                fontSize: 19,
                fontWeight: "700",
                color: "#00000099",
              }}
            >
              ピンの場所を選択中...
            </Text>
            <PinButton
              title="完了"
              disabled={!point}
              onPress={() => {
                if (point) onConfirm(point);
              }}
            />
          </View>
        </>
      ) : (
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
      )}
    </View>
  );
}
