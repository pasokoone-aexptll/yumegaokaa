import { ReviewAvatars } from "../components/debug/ReviewAvatars";
import { Stack, useLocalSearchParams } from "expo-router";
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
  const { scene } = useLocalSearchParams<{ scene?: string }>();
  const data = pinData({
    ...pin,
    recruiting: scene !== "normal",
    people: scene === "empty" ? [] : pin.people,
    count: scene === "empty" ? 0 : pin.count,
    body: scene === "normal" ? "警察なんか多い" : pin.body,
    attendance:
      scene === "planned" || scene === "confirmed" ? "planned" : "left",
  });
  return (
    <>
      <Stack.Screen
        options={{
          presentation: "formSheet",
          sheetAllowedDetents:
            scene === "full" || scene === "confirmed" ? [1] : [0.47, 1],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      {scene === "confirmed" ? (
        <PinConfirmedView data={data} />
      ) : (
        <PinDetailView data={data} id={pin.id} fromMap="1" readOnly />
      )}
    </>
  );
}
