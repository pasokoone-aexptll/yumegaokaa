import type { SwitchProps } from "react-native";
import { Host, Toggle } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  labelsHidden,
  disabled as disabledModifier,
  tint,
  fixedSize,
} from "@expo/ui/swift-ui/modifiers";
export function NativeToggle({
  value,
  onValueChange,
  disabled,
  accessibilityLabel: label = "切り替え",
}: SwitchProps) {
  return (
    <Host
      matchContents
      alignment="center"
      ignoreSafeArea="all"
    >
      <Toggle
        isOn={value}
        onIsOnChange={onValueChange}
        modifiers={[
          labelsHidden(),
          fixedSize(),
          accessibilityLabel(label),
          disabledModifier(!!disabled),
          tint("#34C759"),
        ]}
      />
    </Host>
  );
}
