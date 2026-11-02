import { View, type ViewProps } from "react-native";
// Android native gesture pass-through remains a porting verification item.
export function ChatTouchRegion({
  surface: _surface,
  ...props
}: ViewProps & { surface?: boolean }) {
  return <View {...props} />;
}
