import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

// Vector reconstruction of the supplied Figma cloud/exit mark. Keep the stem
// and ground point inside the marker bounds so the geographic anchor is clear.
export function EventCloudPin() {
  return (
    <Svg width={94} height={110} viewBox="0 0 94 110" accessible={false}>
      <Defs>
        <LinearGradient id="event-cloud" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ed52f5" />
          <Stop offset="1" stopColor="#ff5276" />
        </LinearGradient>
      </Defs>
      <Path d="M47 49V99" stroke="white" strokeWidth={5} />
      <Ellipse
        cx={47}
        cy={101}
        rx={8}
        ry={5}
        fill="#ff568d"
        stroke="white"
        strokeWidth={2}
      />
      <G rotation={-16} origin="47,30">
        <Path
          d="M19 48C4 48 3 29 17 25C14 11 35 5 45 14C57 1 79 10 77 24C94 27 90 46 75 48Z"
          fill="url(#event-cloud)"
          stroke="white"
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <Path
          d="M19 44C9 44 8 31 22 29C17 16 35 10 45 20C57 8 75 15 72 28C85 28 86 42 75 44"
          fill="none"
          stroke="#ffb9ee"
          strokeWidth={1.5}
        />
        <G rotation={-12} origin="47,29">
          <Rect x={29} y={19} width={15} height={23} rx={1} fill="#fff5ba" />
          <Circle cx={51} cy={19} r={3.5} fill="white" />
          <Path
            d="M49 25L43 31L35 31M48 26L55 29L61 27M47 28L52 35L61 40M49 34L43 40L38 40"
            fill="none"
            stroke="white"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </G>
    </Svg>
  );
}
