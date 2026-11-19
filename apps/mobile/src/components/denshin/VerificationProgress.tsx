import { ActivityIndicator, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SuperAsset } from "../icons/SuperAsset";

export function VerificationProgress({
  complete,
  busy,
}: {
  complete: boolean;
  busy: boolean;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={
        complete ? "認証完了" : busy ? "認証しています" : "コードを待っています"
      }
      style={{
        width: 58,
        height: 58,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {complete ? (
        <SuperAsset name="checkRounded" size={58} />
      ) : busy ? (
        <ActivityIndicator size="large" color="rgba(0,0,0,0.4)" />
      ) : (
        <Svg width={44} height={44}>
          <Circle
            cx={22}
            cy={22}
            r={20}
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={2}
          />
        </Svg>
      )}
    </View>
  );
}
