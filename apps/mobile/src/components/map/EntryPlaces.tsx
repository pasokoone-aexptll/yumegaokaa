import { Alert, View } from "react-native";
import { Boundary, Marker } from "./PlatformMap";
import { MapAsset } from "./MapAsset";

export type EntryMap = {
  name: string;
  boundary: GeoJSON.Polygon | null;
  places: { title: string; longitude: number; latitude: number }[];
};

export function EntryPlaces({ map }: { map: EntryMap }) {
  return <>
    {map.boundary && <Boundary data={map.boundary} />}
    {map.places.map((place, index) => (
      <Marker key={JSON.stringify([place.longitude, place.latitude, place.title, index])}
        lngLat={[place.longitude, place.latitude]}
        onPress={() => Alert.alert(place.title, "ここでNFCを読み取って入街")}>
        <View accessible accessibilityLabel={place.title + "・NFCログイン場所"}
          style={{ backgroundColor: "#fff", padding: 5, borderRadius: 18, borderWidth: 2, borderColor: "#1387bd" }}>
          <MapAsset name="plug" size={23} />
        </View>
      </Marker>
    ))}
  </>;
}
