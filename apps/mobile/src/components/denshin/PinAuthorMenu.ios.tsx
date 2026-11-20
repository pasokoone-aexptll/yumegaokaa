import { Button, ContextMenu, Host, RNHostView } from "@expo/ui/swift-ui";
import type { PinAuthorMenuProps } from "./PinAuthorMenu";

export function PinAuthorMenu({
  children,
  onReport,
  onBlock,
}: PinAuthorMenuProps) {
  return (
    <Host style={{ width: 64, height: 64 }}>
      <ContextMenu>
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
