import { Host, Toggle } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  background,
  fixedSize,
  labelsHidden,
  padding,
  shapes,
  tint,
} from "@expo/ui/swift-ui/modifiers";

/** The outline follows the native switch's intrinsic capsule, equally on all sides. */
export function ParticipationSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Host
      style={{ width: 74, height: 40 }}
      alignment="center"
      ignoreSafeArea="all"
      colorScheme="dark"
    >
      <Toggle
        isOn={value}
        onIsOnChange={onChange}
        modifiers={[
          labelsHidden(),
          fixedSize(),
          accessibilityLabel("街への参加"),
          tint("#34C759"),
          padding({ all: 4 }),
          background(
            value ? "#45E571" : "rgba(255,255,255,0.15)",
            shapes.capsule(),
          ),
        ]}
      />
    </Host>
  );
}
