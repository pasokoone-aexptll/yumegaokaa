import { router } from "expo-router";

let request = 0;

export function openMapAt(longitude: number, latitude: number) {
  router.navigate({
    pathname: "/",
    params: {
      longitude,
      latitude,
      // Repeated requests for the same point must still move the camera.
      mapRequest: `${Date.now()}-${++request}`,
    },
  });
}
