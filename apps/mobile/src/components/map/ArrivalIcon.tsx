import { View } from "react-native";
import { MapAsset } from "./MapAsset";
export function ArrivalIcon() {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#ffffff1a",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MapAsset name="plug" width={11} height={18} />
    </View>
  );
}
