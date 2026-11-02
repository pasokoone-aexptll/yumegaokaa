import Svg, { Circle, Path } from "react-native-svg";
/** A system arrival row is distinct from an authored chat message. */
export function ArrivalIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" accessible={false}>
      <Circle cx={16} cy={16} r={16} fill="white" fillOpacity={0.9} />
      <Path
        d="M12 7v5m8-5v5M10 12h12v3a6 6 0 0 1-5 5.92V25h-2v-4.08A6 6 0 0 1 10 15Z"
        fill="white"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
