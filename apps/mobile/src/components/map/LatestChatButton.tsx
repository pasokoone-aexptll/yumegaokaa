import { GlassView } from "./PlatformGlass";
import { IconPressable } from "../icons/IconMotion";
import { SuperAsset } from "../icons/SuperAsset";

export function LatestChatButton({ onPress }: { onPress: () => void }) {
  return (
    <IconPressable
      accessibilityRole="button"
      accessibilityLabel="最新へ"
      hitSlop={8}
      onPress={onPress}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        isInteractive
        style={{
          width: 48,
          height: 30,
          borderRadius: 15,
          borderCurve: "continuous",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SuperAsset
          name="chevron-base"
          size={26}
          rotation={90}
          tint="#C5C5C5"
        />
      </GlassView>
    </IconPressable>
  );
}
