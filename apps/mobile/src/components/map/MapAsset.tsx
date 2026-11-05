import { UIIcon, type UIIconName } from "../icons/UIIcon";
import { SvgXml } from "react-native-svg";
import { brandAndTabSvgAssets } from "./brandAndTabAssets";

const iconAliases = {
  "chevron.right": "chevron-right",
  usericon: "users",
  clock: "clock",
  close: "x",
  trash: "trash",
  checkcreate: "check",
  CreatePIN: "create-pin",
  Navi: "navi",
  plug: "arrival-plug",
} as const satisfies Record<string, UIIconName>;

export function MapAsset({
  name,
  size = 28,
  width = size,
  height = size,
  tint,
  fillOpacity,
}: {
  name: keyof typeof brandAndTabSvgAssets | keyof typeof iconAliases;
  size?: number;
  width?: number;
  height?: number;
  tint?: string;
  fillOpacity?: number;
}) {
  const icon =
    name in iconAliases
      ? iconAliases[name as keyof typeof iconAliases]
      : undefined;
  if (icon)
    return <UIIcon name={icon} size={size} width={width} height={height} />;
  const source = brandAndTabSvgAssets[name as keyof typeof brandAndTabSvgAssets];
  const xml = fillOpacity === undefined ? source : source.replace(/fill-opacity="[^"]*"/g, `fill-opacity="${fillOpacity}"`);
  return (
    <SvgXml
      xml={
        tint
          ? xml.replace(/(fill|stroke)="(?!none)[^"]*"/g, `$1="${tint}"`)
          : xml
      }
      width={width}
      height={height}
      accessible={false}
    />
  );
}
