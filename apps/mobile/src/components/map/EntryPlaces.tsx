import { EntryPlaceMaterial } from "./EntryPlaceMaterial";
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
            <EntryPlaceMaterial
              coordinate={[place.longitude, place.latitude]}
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
    backgroundColor: "transparent",
    padding: 3,
    borderRadius: 14,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  pinBorder: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderCurve: "continuous",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
});
