import { Platform } from "react-native";
import type { useRouter } from "expo-router";

let request = 0;

export function openMapAt(
  router: ReturnType<typeof useRouter>,
  longitude: number,
  latitude: number,
  detail?: { kind: "event" | "recruitment" | "denshin"; id: string },
) {
  // Dismiss the detail stack first, then explicitly select the Map tab.
  // dismissTo alone retains the selected Home tab when the root already exists.
  if (Platform.OS === "ios" && router.canDismiss()) router.dismissAll();
  const open = router.navigate;
  open({
    pathname: Platform.OS === "android" ? "/(tabs)" : "/",
    params: {
      longitude,
      latitude,
      detailKind: detail?.kind ?? "",
      detailId: detail?.id ?? "",
      // Repeated requests for the same point must still move the camera.
      mapRequest: `${Date.now()}-${++request}`,
    },
  });
}
