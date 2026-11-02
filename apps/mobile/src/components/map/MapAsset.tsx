import { SvgXml } from "react-native-svg";
import { mapSvgAssets } from "./mapAssets";

export function MapAsset({
  name,
  size = 28,
  width = size,
  height = size,
  centered = false,
}: {
  name: keyof typeof mapSvgAssets;
  size?: number;
  width?: number;
  height?: number;
  centered?: boolean;
}) {
  // Figma exports include asymmetric shadow margins. Use the visible path bounds
  // plus equal padding for circular controls; retain the original SVG elsewhere.
  const controlViewBox = {
    CreatePIN: "12.188 6.8243 22.6144 22.6144",
    Navi: "8.2729 6.2309 22.7687 22.7687",
  };
  const viewBox =
    centered && name in controlViewBox
      ? controlViewBox[name as keyof typeof controlViewBox]
      : null;
  const xml = viewBox
    ? mapSvgAssets[name].replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
    : mapSvgAssets[name];
  return <SvgXml xml={xml} width={width} height={height} accessible={false} />;
}
