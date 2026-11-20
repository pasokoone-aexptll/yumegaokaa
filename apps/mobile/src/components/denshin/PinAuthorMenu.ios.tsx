import { Button, ContextMenu, Host, RNHostView } from "@expo/ui/swift-ui";
import {
  accessibilityElement,
  accessibilityLabel,
  accessibilityHint,
} from "@expo/ui/swift-ui/modifiers";
import type { PinAuthorMenuProps } from "./PinAuthorMenu";

export function PinAuthorMenu({
  children,
  onReport,
  onBlock,
}: PinAuthorMenuProps) {
  return (
    <Host style={{ width: 64, height: 64 }}>
      <ContextMenu
        modifiers={[
          accessibilityElement("combine"),
          accessibilityLabel("投稿者の操作"),
          accessibilityHint("長押しで通報とブロックを表示"),
        ]}
      >
        <ContextMenu.Trigger>
          <RNHostView matchContents>
            <>{children}</>
          </RNHostView>
        </ContextMenu.Trigger>
        <ContextMenu.Items>
          <Button label="通報" onPress={onReport} />
          <Button label="ブロック" role="destructive" onPress={onBlock} />
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
