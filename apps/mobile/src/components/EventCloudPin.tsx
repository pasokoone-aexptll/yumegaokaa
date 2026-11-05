import { useContext } from "react";
import { RefreshMarker } from "./map/markerScale";
import { Image, Platform } from "react-native";
export function EventCloudPin() {
  const refresh = useContext(RefreshMarker);
  return (
    <Image
      source={Platform.OS === "ios" ? require("../../assets/map-markers/event-shadow-ios.png") : require("../../assets/map-markers/event-shadow.png")}
      style={{ width: 127, height: 125 }}
      onLoadEnd={refresh}
      resizeMode="contain"
      accessible={false}
    />
  );
}
