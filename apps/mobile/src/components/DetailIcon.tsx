import Svg, { Path, Circle } from "react-native-svg";
const paths = {
  "chevron-back": "M15 5l-7 7 7 7",
  "chevron-forward": "M9 5l7 7-7 7",
  reload: "M20 8A8 8 0 1 0 20 16M20 3v5h-5",
  "calendar-outline": "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",
  "location-outline":
    "M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13zM12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  "people-outline":
    "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M2 21v-3c0-7 14-7 14 0v3M17 4c5 0 5 7 0 7M19 14c3 1 3 4 3 7",
  "person-circle-outline":
    "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 22v-3c0-8 16-8 16 0v3",
  "person-add-outline":
    "M8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M1 21v-3c0-6 14-6 14 0v3M19 6v8M15 10h8",
  "create-outline": "M15 4l5 5M4 20l5-1L21 7l-4-4L5 15z",
  "flag-outline": "M5 22V3c5-4 9 4 15 0v11c-6 4-10-4-15 0",
  "images-outline": "M3 3h18v18H3zM3 18l6-7 4 4 3-3 5 6M15 7h.01",
  "notifications-outline": "M4 18h16l-2-4V9c0-8-12-8-12 0v5zM9 21h6",
  "hand-left-outline":
    "M6 13V5c0-2 3-2 3 0v7-9c0-2 3-2 3 0v9-8c0-2 3-2 3 0v8-6c0-2 3-2 3 0v10c0 8-10 8-13 3l-3-5c-1-2 1-3 3-1l1 1",
  "shield-checkmark-outline": "M12 2L3 6v7c0 6 9 9 9 9s9-3 9-9V6zM7 12l3 3 7-7",
  "wifi-outline":
    "M2 8c6-6 14-6 20 0M5 12c4-4 10-4 14 0M9 16c2-2 4-2 6 0M12 20h.01",
  "construct-outline":
    "M14 3l-2 5 4 4 5-2c1 6-4 8-8 6l-7 7-4-4 7-7C7 7 9 2 14 3",
  "time-outline": "M12 7v6l4 2",
  "checkmark-circle": "M7 12l3 3 7-7",
  "checkmark-circle-outline": "M7 12l3 3 7-7",
  "close-circle-outline": "M8 8l8 8M16 8l-8 8",
  "ellipse-outline": "",
};
export function DetailIcon({
  name,
  size = 22,
  color = "#111",
}: {
  name: keyof typeof paths;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(name.includes("circle") ||
        name === "ellipse-outline" ||
        name === "time-outline") && <Circle cx={12} cy={12} r={9} />}
      <Path d={paths[name]} />
    </Svg>
  );
}
