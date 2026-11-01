import { SvgXml } from "react-native-svg";
import { mapSvgAssets } from "./mapAssets";

export function MapAsset({
  name,
  size = 28,
  width = size,
  height = size,
}: {
  name: keyof typeof mapSvgAssets;
  size?: number;
  width?: number;
  height?: number;
}) {
  return (
    <SvgXml
      xml={mapSvgAssets[name]}
      width={width}
      height={height}
      accessible={false}
    />
  );
}
