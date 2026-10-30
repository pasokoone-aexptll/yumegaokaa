import { useState } from "react";
import { Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { streetMapStyles as styles } from "./streetMapStyles";
import { visiblePresenceIcons } from "../lib/presenceHeader";

export function PresenceHeader({ icons }: { icons: (string | null)[] }) {
  const [width, setWidth] = useState(0);
  const [badgeWidth, setBadgeWidth] = useState(0);
  if (!icons.length) return null;
  const shown = visiblePresenceIcons(icons.length, width, badgeWidth);
  return (
    <View
      style={styles.people}
      accessible
      accessibilityLabel={`気配の街アイコン ${icons.length}人分`}
    >
      <View
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
          style={[styles.peopleText, { position: "absolute", opacity: 0 }]}
        >
          +{icons.length}
        </Text>
        {icons.slice(0, shown).map((path, index) => (
          <Avatar
            key={index}
            bucket="street-icons"
            path={path ?? undefined}
            name="✦"
            size={34}
          />
        ))}
        {shown < icons.length && (
          <Text style={[styles.peopleText, { flexShrink: 1 }]}>
            +{icons.length - shown}
          </Text>
        )}
      </View>
    </View>
  );
}
