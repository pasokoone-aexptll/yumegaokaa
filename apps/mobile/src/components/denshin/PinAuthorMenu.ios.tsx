import { Button, Host, Image, Menu } from "@expo/ui/swift-ui";
import { Platform } from "react-native";
import {
  accessibilityLabel,
  buttonStyle,
  buttonBorderShape,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import type { PinAuthorMenuProps } from "./PinAuthorMenu";

export function PinAuthorMenu({ onReport, onBlock }: PinAuthorMenuProps) {
  return (
    <Host
      style={{ width: 44, height: 44 }}
      alignment="center"
      colorScheme="dark"
      ignoreSafeArea="all"
    >
      <Menu
        label={
          <Image
            systemName="ellipsis"
            size={24}
            color="rgba(255,255,255,0.7)"
            modifiers={[frame({ width: 28, height: 28 })]}
          />
        }
        modifiers={[
          accessibilityLabel("PINのその他の操作"),
          buttonStyle(Number(Platform.Version) >= 26 ? "glass" : "bordered"),
          buttonBorderShape("circle"),
          tint("rgba(255,255,255,0.7)"),
        ]}
      >
        <Button label="通報" onPress={onReport} />
        <Button label="ブロック" role="destructive" onPress={onBlock} />
      </Menu>
    </Host>
  );
}
