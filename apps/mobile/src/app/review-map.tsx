import { DenshinPlacementPreview } from "../components/pins/DenshinPlacementPreview";
import { StatusMessageInput } from "../components/denshin/StatusMessageInput";
import { LatestChatButton } from "../components/map/LatestChatButton";
import { MapHeader } from "../components/map/MapHeader";
import { MapStatusBanner } from "../components/map/MapStatusBanner";
import { pin as reviewPin } from "../components/debug/figmaFixtures";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reviewEnabled } from "../components/debug/reviewEnabled";
import { Map, Camera } from "../components/map/PlatformMap";
import { EntryPlaces } from "../components/map/EntryPlaces";
import { StreetMapMarkers } from "../components/StreetMapMarkers";
import { liveCells } from "../lib/presence";

// Simulator-only rendering probe. Uses the production marker, without RPCs or visits.
export default function MapReview() {
  return reviewEnabled ? <Scene /> : null;
}
function Scene() {
  const router = useRouter();
  const { scene, short, normal } = useLocalSearchParams<{
    scene?: string;
    short?: string;
    normal?: string;
  }>();
  const [previewOnly, setPreviewOnly] = useState(true);
  const [participating, setParticipating] = useState(true);
  const [ghost, setGhost] = useState(false);
  const [placesVisible, setPlacesVisible] = useState(false);
  const [dropRevision, setDropRevision] = useState(0);
  const [placementPoint, setPlacementPoint] = useState<[number, number]>([
    139.7109, 35.7295,
  ]);
  const [now] = useState(() => Date.now());
  const cells = liveCells(
    {
      server_time: new Date(now).toISOString(),
      checked_in_count: 3,
      presence_count: 3,
      cells: [
        {
          cell_id: "review-missing-icons",
          area_version: "review",
          grid_version: "review",
          anchor: { longitude: 139.7109, latitude: 35.7295 },
          expiry_groups: [
            {
              expires_at: new Date(now + 600000).toISOString(),
              count: 3,
              icons: [null, null, null],
            },
          ],
        },
      ],
    },
    now,
  );
  const insets = useSafeAreaInsets();
  const [settled, setSettled] = useState(0);
  const [presses, setPresses] = useState(0);
  const [reviewBodies, setReviewBodies] = useState([
    "",
    "初めての人も歓迎",
    "初めての人も歓迎\n池袋で会いましょう",
  ]);
  return (
    <View style={{ flex: 1 }}>
      <Map
        style={{ flex: 1 }}
        placement={
          scene === "alignment" && previewOnly
            ? {
                point: placementPoint,
                revision: dropRevision,
                active: true,
                onDrop: (point) => {
                  setPlacementPoint(point);
                  setDropRevision((r) => r + 1);
                },
                preview: (
                  <DenshinPlacementPreview
                    draft={{
                      body: reviewPin.body,
                      recruiting: true,
                      limited: true,
                      capacity: reviewPin.capacity ?? 12,
                      original: reviewPin,
                    }}
                    name={reviewPin.display_name}
                    avatar={reviewPin.avatar_path}
                  />
                ),
              }
            : undefined
        }
        onMovingChange={(moving) => {
          if (!moving) setSettled((n) => n + 1);
        }}
        onPress={() => setPresses((n) => n + 1)}
      >
        <Camera
          initialViewState={{
            center: [139.7109, 35.7295],
            zoom: 17,
            pitch: 55,
          }}
        />
        {scene === "presence" || scene === "pin" || scene === "alignment" ? (
          <StreetMapMarkers
            cells={scene === "presence" ? cells : []}
            pins={
              scene === "pin" || (scene === "alignment" && !previewOnly)
                ? [
                    {
                      ...reviewPin,
                      recruiting: normal !== "1",
                      body: short === "1" ? "テスト" : reviewPin.body,
                      longitude: placementPoint[0],
                      latitude: placementPoint[1],
                      count: scene === "alignment" ? reviewPin.count : 5,
                    },
                  ]
                : []
            }
            events={[]}
            recruitments={[]}
            now={now}
            onSelect={() => {}}
          />
        ) : (
          <EntryPlaces
            map={{
              name: "表示確認",
              boundary: null,
              places: [
                { title: "表示確認", longitude: 139.7109, latitude: 35.7295 },
              ],
            }}
          />
        )}
      </Map>
      {scene === "controls" && (
        <View
          style={{ position: "absolute", top: insets.top, left: 20, right: 20 }}
        >
          <MapHeader
            active={participating}
            count={12}
            onToggle={setParticipating}
            ghost={ghost}
            onModeChange={setGhost}
            placesVisible={placesVisible}
            onTogglePlaces={() => setPlacesVisible((value) => !value)}
          />
          <MapStatusBanner
            message={
              participating
                ? "街にログインしました"
                : "街からログアウトしました"
            }
            autoDismiss={false}
          />
        </View>
      )}
      {scene === "input" && (
        <View
          style={{
            position: "absolute",
            top: "45%",
            left: 20,
            right: 20,
            gap: 24,
          }}
        >
          {reviewBodies.map((value, index) => (
            <StatusMessageInput
              key={index}
              value={value}
              onChangeText={(body) =>
                setReviewBodies((values) =>
                  values.map((old, i) => (i === index ? body : old)),
                )
              }
            />
          ))}
        </View>
      )}
      {(scene === "latest" || scene === "controls") && (
        <View
          style={{ position: "absolute", bottom: 160, alignSelf: "center" }}
        >
          <LatestChatButton onPress={() => setPresses((n) => n + 1)} />
        </View>
      )}
      <View
        style={{
          position: "absolute",
          top: insets.top + (scene === "controls" ? 160 : 12),
          left: 20,
          right: 20,
          padding: 12,
          borderRadius: 16,
          backgroundColor: "white",
          gap: 8,
        }}
      >
        {scene === "alignment" && (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPreviewOnly((v) => !v)}
            >
              <Text>
                {previewOnly
                  ? "仮置き表示 → 確定表示"
                  : "確定表示 → 仮置き表示"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDropRevision((v) => v + 1)}
            >
              <Text>下降を再生</Text>
            </Pressable>
          </>
        )}
        <Text>
          カメラ停止 {settled} / 地図タップ {presses}
        </Text>
        {scene === "controls" && (
          <Pressable onPress={() => router.push("/review-pin?scene=half")}>
            <Text>PINシートを開く（通信なし）</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSettled(0);
            setPresses(0);
          }}
        >
          <Text>確認カウンターをリセット</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text>確認を終了</Text>
        </Pressable>
      </View>
    </View>
  );
}
