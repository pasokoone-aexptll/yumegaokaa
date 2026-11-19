import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";
import { Boundary, Marker } from "./PlatformMap";
import { SuperAsset } from "../icons/SuperAsset";

export type EntryMap = {
  name: string;
  boundary: GeoJSON.Polygon | null;
  places: { title: string; longitude: number; latitude: number }[];
};

export function EntryPlaces({ map }: { map: EntryMap }) {
  return (
    <>
      {map.boundary && <Boundary data={map.boundary} />}
      {map.places.map((place, index) => (
        <Marker
          key={`${place.longitude}:${place.latitude}:${index}`}
          lngLat={[place.longitude, place.latitude]}
          passive
        >
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={place.title + "・NFCログイン場所"}
            style={styles.pin}
          >
            <BlurView
              pointerEvents="none"
              intensity={100}
              tint="systemThinMaterialDark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.pinBorder}>
              <SuperAsset
                name="pluglogin"
                size={23}
                tint="white"
                opacity={0.45}
              />
            </View>
          </View>
        </Marker>
      ))}
    </>
  );
}
const styles = StyleSheet.create({
  pin: {
    backgroundColor: "rgba(0,0,0,0.12)",
    padding: 3,
    borderRadius: 14,
    overflow: "hidden",
  },
  pinBorder: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
});
