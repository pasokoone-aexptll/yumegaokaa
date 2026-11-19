import { requireNativeViewManager } from "expo-modules-core";
import type { NativeSyntheticEvent, ViewProps } from "react-native";

const Switch = requireNativeViewManager<
  ViewProps & {
    value: boolean;
    onValueChange: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
  }
>("PresenceNative", "CityParticipationSwitch");

export function ParticipationSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      style={{ width: 74, height: 40 }}
      value={value}
      onValueChange={({ nativeEvent }) => onChange(nativeEvent.value)}
    />
  );
}
