import { Switch, View } from "react-native";
import { SmoothSurface } from "./SmoothSurface";

export function ParticipationSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <SmoothSurface
      color="#ffffff26"
      blurIntensity={25}
      radius={26}
      style={{
        width: 82,
        height: 46,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Switch
          accessibilityLabel="街への参加"
          value={value}
          onValueChange={onChange}
        />
      </View>
    </SmoothSurface>
  );
}
