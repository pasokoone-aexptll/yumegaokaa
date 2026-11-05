import { Platform } from "react-native";
import type { useRouter } from "expo-router";

let request = 0;

export function openMapAt(
  router: ReturnType<typeof useRouter>,
  longitude: number,
  latitude: number,
  detail?: { kind: "event" | "recruitment"; id: string },
) {
  const open = Platform.OS === "android" ? router.navigate : router.dismissTo;
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
