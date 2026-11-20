import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reviewEnabled } from "../components/debug/reviewEnabled";
import { Map, Camera } from "../components/map/PlatformMap";
import { EntryPlaces } from "../components/map/EntryPlaces";

// Simulator-only rendering probe. Uses the production marker, without RPCs or visits.
export default function MapReview() {
  return reviewEnabled ? <Scene /> : null;
}
function Scene() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settled, setSettled] = useState(0);
  const [presses, setPresses] = useState(0);
  return (
    <View style={{ flex: 1 }}>
      <Map
        style={{ flex: 1 }}
        onMovingChange={(moving) => { if (!moving) setSettled((n) => n + 1); }}
        onPress={() => setPresses((n) => n + 1)}
      >
        <Camera initialViewState={{ center: [139.7109, 35.7295], zoom: 17, pitch: 55 }} />
        <EntryPlaces map={{ name: "表示確認", boundary: null, places: [
          { title: "表示確認", longitude: 139.7109, latitude: 35.7295 },
        ] }} />
      </Map>
      <View style={{ position: "absolute", top: insets.top + 12, left: 20, right: 20, padding: 12, borderRadius: 16, backgroundColor: "white", gap: 8 }}>
        <Text>カメラ停止 {settled} / 地図タップ {presses}</Text>
        <Pressable accessibilityRole="button" onPress={() => { setSettled(0); setPresses(0); }}>
          <Text>確認カウンターをリセット</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text>確認を終了</Text>
        </Pressable>
      </View>
    </View>
  );
}
