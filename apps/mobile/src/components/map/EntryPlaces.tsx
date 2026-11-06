import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Boundary, Marker } from "./PlatformMap";
import { MapAsset } from "./MapAsset";

export type EntryMap = {
  name: string;
  boundary: GeoJSON.Polygon | null;
  places: { title: string; longitude: number; latitude: number }[];
};

export function EntryPlaces({ map }: { map: EntryMap }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <>
    {map.boundary && <Boundary data={map.boundary} />}
    {map.places.map((place, index) => {
      const id = JSON.stringify([place.longitude, place.latitude, place.title, index]);
      const open = selected === id;
      return (
        <Marker key={id} lngLat={[place.longitude, place.latitude]}
          snapshotKey={String(open)} onPress={() => setSelected(current => current === id ? null : id)}>
          <View accessible accessibilityRole="button" accessibilityState={{ expanded: open }}
            accessibilityLabel={place.title + "・NFCログイン場所"} style={styles.marker}>
            {open && <View style={styles.callout}>
              <View style={styles.bubble}>
                <Text numberOfLines={1} style={styles.title}>{place.title}</Text>
                <Text style={styles.note}>ここでNFCを読み取って入街</Text>
              </View>
              <View style={styles.tip} />
            </View>}
            <View style={styles.pin}><MapAsset name="plug" size={23} /></View>
            {/* Both native maps anchor the annotation at its center. */}
            {open && <View pointerEvents="none" style={styles.balance} />}
          </View>
        </Marker>
      );
    })}
  </>;
}
const calloutHeight = 64;
const styles = StyleSheet.create({
  marker: { alignItems: "center" },
  callout: { height: calloutHeight, justifyContent: "flex-end", alignItems: "center" },
  bubble: { maxWidth: 240, alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 13, backgroundColor: "white" },
  title: { color: "#14374a", fontSize: 15, fontWeight: "700" },
  note: { color: "#435864", fontSize: 12 },
  tip: { borderTopWidth: 7, borderLeftWidth: 6, borderRightWidth: 6, borderColor: "transparent", borderTopColor: "white" },
  pin: { backgroundColor: "#fff", padding: 5, borderRadius: 18, borderWidth: 2, borderColor: "#1387bd" },
  balance: { height: calloutHeight },
});
