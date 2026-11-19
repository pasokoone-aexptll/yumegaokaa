import { SvgXml } from "react-native-svg";
import assets from "./superassets.json";

export type SuperAssetName = keyof typeof assets;
/** User-owned original geometry; tint only solid paint, never gradient references. */
export function SuperAsset({
  name,
  size = 24,
  width = size,
  height = size,
  tint,
  opacity = 1,
}: {
  name: SuperAssetName;
  size?: number;
  width?: number;
  height?: number;
  tint?: string;
  opacity?: number;
}) {
  const source = assets[name];
  const xml = tint
    ? source
        .replace(/(fill|stroke)="(?!none|url\()[^"]*"/g, `$1="${tint}"`)
        .replace(/(?:fill|stroke)-opacity="[^"]*"/g, "")
    : source;
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={height}
      opacity={opacity}
      accessible={false}
    />
  );
}

export function DenshinLogo({
  dark = false,
  monochrome = false,
  width = 96,
}: {
  dark?: boolean;
  monochrome?: boolean;
  width?: number;
}) {
  const xml = dark
    ? assets["電信"]
        .replace(/stroke="#01AE6B"/gi, 'stroke="white"')
        .replace(/fill="#01AE6B"/gi, 'fill="white"')
        .replace(/#E6F7F0/gi, "black")
    : monochrome
      ? assets["電信"]
          .replace(/stroke="#01AE6B"/gi, 'stroke="rgba(0,0,0,0.2)"')
          .replace(/fill="#01AE6B"/gi, 'fill="black"')
          .replace(/#E6F7F0/gi, "white")
      : assets["電信"];
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={(width * 40) / 96}
      opacity={dark ? 0.65 : 1}
      accessible={false}
    />
  );
}
