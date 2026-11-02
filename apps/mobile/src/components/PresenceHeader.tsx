import { SmoothSurface } from "./map/SmoothSurface";
import { useState } from "react";
import { Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { streetMapStyles as styles } from "./streetMapStyles";
import { visiblePresenceIcons } from "../lib/presenceHeader";

export function PresenceHeader({ icons }: { icons: (string | null)[] }) {
  const [width, setWidth] = useState(0);
  const [badgeWidth, setBadgeWidth] = useState(0);
  if (!icons.length) return null;
  const shown = visiblePresenceIcons(icons.length, width, badgeWidth, 38, 4);
  return (
    <SmoothSurface
      color="#00000099"
      blurIntensity={20}
      radius={28}
      style={{ padding: 5, marginTop: 2 }}
    >
      <View
        accessible
        accessibilityLabel={`有効な気配 ${icons.length}人`}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <Text
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onLayout={({ nativeEvent }) =>
            setBadgeWidth(nativeEvent.layout.width)
          }
          style={[
            styles.peopleText,
            { position: "absolute", opacity: 0, fontSize: 20 },
          ]}
        >
          +{icons.length}
        </Text>
        {icons.slice(0, shown).map((path, index) => (
          <Avatar
            key={index}
            bucket="street-icons"
            path={path ?? undefined}
            name="✦"
            size={38}
          />
        ))}
        {shown < icons.length && (
          <Text
            style={[
              styles.peopleText,
              { flexShrink: 1, color: "#ffffffb3", fontSize: 20 },
            ]}
          >
            +{icons.length - shown}
          </Text>
        )}
      </View>
    </SmoothSurface>
  );
}
