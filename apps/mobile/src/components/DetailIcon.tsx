import { SymbolView } from "expo-symbols";

const symbols = {
  "chevron-back": "chevron.left",
  "chevron-forward": "chevron.right",
  reload: "arrow.clockwise",
  "calendar-outline": "calendar",
  "location-outline": "mappin.and.ellipse",
  "people-outline": "person.2",
  "person-circle-outline": "person.crop.circle",
  "person-add-outline": "person.badge.plus",
  "create-outline": "pencil",
  "flag-outline": "flag",
  "images-outline": "photo.on.rectangle.angled",
  "notifications-outline": "bell",
  "hand-left-outline": "hand.raised",
  "shield-checkmark-outline": "checkmark.shield",
  "wifi-outline": "wifi",
  "construct-outline": "wrench.and.screwdriver",
  "time-outline": "clock",
  "checkmark-circle": "checkmark.circle.fill",
  "checkmark-circle-outline": "checkmark.circle",
  "close-circle-outline": "xmark.circle",
  "ellipse-outline": "circle",
} as const;
export function DetailIcon({
  name,
  size = 22,
  color = "#111",
}: {
  name: keyof typeof symbols;
  size?: number;
  color?: string;
}) {
  return (
    <SymbolView
      name={symbols[name]}
      size={size}
      tintColor={color}
      weight="regular"
      accessible={false}
    />
  );
}
