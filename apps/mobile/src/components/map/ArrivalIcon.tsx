import { View } from "react-native";
import { MapAsset } from "./MapAsset";
export function ArrivalIcon() {
  return (
    <View
      style={{
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: "#ffffff1a",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MapAsset name="plug" size={24} />
    </View>
  );
}
