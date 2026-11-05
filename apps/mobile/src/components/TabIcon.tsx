import { MapAsset } from "./map/MapAsset";
import type { ColorValue } from "react-native";
export function TabIcon({
  kind,
  focused,
  color,
}: {
  kind: "home" | "map" | "notification" | "account";
  color: ColorValue | null;
  focused: boolean;
}) {
  const names = {
    home: ["home", "homeSelect"],
    map: ["mapChat", "mapChatSelect"],
    notification: ["notification", "notificationSelect"],
    account: ["account", "accountSelect"],
  } as const;
  return (
    <MapAsset
      name={names[kind][focused ? 1 : 0]}
      size={36}
      tint={typeof color === "string" ? color : undefined}
    />
  );
}
