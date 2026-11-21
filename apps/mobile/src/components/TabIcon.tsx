import { SuperAsset } from "./icons/SuperAsset";
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
  if (kind === "account")
    return (
      <SuperAsset
        name={focused ? "user-fill" : "user"}
        size={32}
        opacity={focused ? 1 : 0.7}
        tint={typeof color === "string" ? color : undefined}
      />
    );
  const names = {
    home: ["home", "homeSelect"],
    map: ["mapChat", "mapChatSelect"],
    notification: ["notification", "notificationSelect"],
    account: ["account", "accountSelect"],
  } as const;
  return (
    <MapAsset
      name={names[kind][focused ? 1 : 0]}
      size={32}
      tint={typeof color === "string" ? color : undefined}
    />
  );
}
