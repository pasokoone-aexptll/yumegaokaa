import { View } from "react-native";
import { SuperAsset } from "../icons/SuperAsset";
/** Real entry phase drives the artwork; presentation never advances authentication. */
export function EntryAnimation({
  phase,
  size,
}: {
  phase: "explain" | "scanning" | "checking" | "success";
  size: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: 110,
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
      }}
    >
      <SuperAsset
        name="非常口"
        size={90}
        tint={phase === "success" ? "#34C759" : "white"}
        opacity={phase === "success" ? 1 : 0.55}
      />
    </View>
  );
}
