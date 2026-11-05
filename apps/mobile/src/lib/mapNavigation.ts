import type { useRouter } from "expo-router";

let request = 0;

export function openMapAt(
  router: ReturnType<typeof useRouter>,
  longitude: number,
  latitude: number,
  detail?: { kind: "event" | "recruitment"; id: string },
) {
  router.dismissTo({
    pathname: "/",
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
