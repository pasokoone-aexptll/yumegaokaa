import { ReviewAvatars } from "../components/debug/ReviewAvatars";
import { StreetEntryView } from "./street-entry";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";
import { PinDetailView } from "./map-pin";
import { PinConfirmedView } from "./pin-confirmed";
import { pin, pinData } from "../components/debug/figmaFixtures";
import { reviewEnabled } from "../components/debug/reviewEnabled";
export default function PinReview() {
  return reviewEnabled ? (
    <ReviewAvatars>
      <Scene />
    </ReviewAvatars>
  ) : null;
}
function Scene() {
  const router = useRouter();
  const { scene } = useLocalSearchParams<{ scene?: string }>();
  const entry = Platform.OS === "android" && scene?.startsWith("entry");
  const mine = Platform.OS === "android" && scene?.startsWith("mine");
  const normal = scene === "normal" || (mine && scene === "mine-normal");
  const data = pinData({
    ...pin,
    mine: !!mine,
    recruiting: !normal,
    people: scene === "empty" ? [] : pin.people,
    count: scene === "empty" ? 0 : pin.count,
    body: normal ? "警察なんか多い" : pin.body,
    attendance:
      scene === "planned" || scene === "confirmed" ? "planned" : "left",
  });
  return (
    <>
      <Stack.Screen
        options={{
          presentation: "formSheet",
          sheetAllowedDetents:
            scene === "full" || scene === "confirmed"
              ? [1]
              : entry
                ? [0.5, 1]
                : [0.47, 1],
          ...(Platform.OS === "android"
            ? { sheetLargestUndimmedDetentIndex: "last" as const }
            : {}),
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      {entry ? (
        <StreetEntryView
          phase={scene === "entry-success" ? "success" : "checking"}
          count={54}
          onClose={() => router.back()}
          onScan={() => {}}
        />
      ) : scene === "confirmed" ? (
        <PinConfirmedView data={data} />
      ) : (
        <PinDetailView data={data} id={pin.id} fromMap="1" readOnly />
      )}
    </>
  );
}
