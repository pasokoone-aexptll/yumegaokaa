import type { DenshinPin } from "./denshin";

export function homePinSections(pins: DenshinPin[]) {
  const attending = (pin: DenshinPin) =>
    pin.attendance === "planned" || pin.attendance === "arrived";
  return [
    {
      key: "attending",
      title: "参加中",
      highlighted: true,
      items: pins.filter(attending),
    },
    {
      key: "recruiting",
      title: "募集中",
      highlighted: true,
      items: pins.filter((pin) => !attending(pin) && pin.recruiting),
    },
    {
      key: "ordinary",
      title: "PIN / 予約募集",
      highlighted: false,
      items: pins.filter((pin) => !attending(pin) && !pin.recruiting),
    },
  ].filter((section) => section.items.length > 0);
}
