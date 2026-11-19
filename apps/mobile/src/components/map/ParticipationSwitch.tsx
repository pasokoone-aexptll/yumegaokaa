import { View } from "react-native";
import { NativeToggle as Switch } from "../denshin/NativeToggle";

export function ParticipationSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: value
          ? "rgba(52,199,89,0.5)"
          : "rgba(255,255,255,0.15)",
        borderRadius: 26,
        width: 74,
        height: 40,
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
    </View>
  );
}
