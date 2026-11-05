import { useContext } from "react";
import { RefreshMarker } from "./map/markerScale";
import { Image } from "react-native";
export function EventCloudPin() {
  const refresh = useContext(RefreshMarker);
  return (
    <Image
      source={require("../../assets/map-markers/event-shadow.png")}
      style={{ width: 127, height: 125 }}
      onLoadEnd={refresh}
      resizeMode="contain"
      accessible={false}
    />
  );
}
