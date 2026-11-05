import { Image } from "react-native";
export function EventCloudPin() {
  return (
    <Image
      source={require("../../assets/illustrations/pin.png")}
      style={{ width: 106, height: 106 }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
