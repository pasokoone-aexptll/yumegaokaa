import { SuperAsset, type SuperAssetName } from "./icons/SuperAsset";
import { UIIcon } from "./icons/UIIcon";
const symbols = {
  "chevron-back": "chevron-left",
  "chevron-forward": "chevron-right",
  reload: "refresh",
  "calendar-outline": "calendar",
  "location-outline": "map-pin",
  "people-outline": "users",
  "person-circle-outline": "user",
  "person-add-outline": "user-plus",
  "create-outline": "pencil",
  "flag-outline": "flag",
  "images-outline": "image",
  "notifications-outline": "bell",
  "hand-left-outline": "hand",
  "shield-checkmark-outline": "shield-check",
  "wifi-outline": "wifi",
  "construct-outline": "wrench",
  "time-outline": "clock",
  "checkmark-circle": "circle-check",
  "checkmark-circle-outline": "circle-check",
  "close-circle-outline": "x",
  "ellipse-outline": "circle",
} as const;
export function DetailIcon({
  name,
  size = 22,
}: {
  name: keyof typeof symbols;
  size?: number;
  color?: string;
}) {
  const supplied: Partial<Record<keyof typeof symbols, SuperAssetName>> = {
    "person-circle-outline": "profile",
    "person-add-outline": "inviteFriends",
    "images-outline": "myCityPoolIcon",
    "hand-left-outline": "Block",
    "shield-checkmark-outline": "accountSettings",
    "construct-outline": "運営",
  };
  const asset = supplied[name];
  if (asset) return <SuperAsset name={asset} size={size} />;
  return <UIIcon name={symbols[name]} size={size} />;
}
