import { Image } from "react-native";
export function EventCloudPin() {
  return (
    <Image
      source={require("../../assets/map-markers/event-shadow.png")}
      style={{ width: 127, height: 125 }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
