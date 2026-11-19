import { SpeechBubble } from "./denshin/SpeechBubble";
import { useState } from "react";
import { Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { streetMapStyles as styles } from "./streetMapStyles";
import { visiblePresenceIcons } from "../lib/presenceHeader";

export function PresenceHeader({ icons }: { icons: (string | null)[] }) {
  const [width, setWidth] = useState(0);
  const [badgeWidth, setBadgeWidth] = useState(0);
  const shown = visiblePresenceIcons(icons.length, width, badgeWidth, 38, 4);
  return (
    <SpeechBubble
      tail="top"
      material
      color="rgba(255,255,255,0.25)"
      style={{ alignSelf: "stretch", marginTop: 4 }}
      bodyStyle={{ minHeight: 49, paddingHorizontal: 6, paddingVertical: 5 }}
    >
      <View
        accessible
        accessibilityLabel={`街にログイン中 ${icons.length}人`}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}
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
        {icons.length === 0 && (
          <Text
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "ui-rounded",
              fontSize: 16,
              paddingLeft: 10,
            }}
          >
            0人
          </Text>
        )}
        {icons.slice(0, shown).map((path, index) => (
          <Avatar
            key={index}
            bucket="street-icons"
            path={path ?? undefined}
            name=""
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
    </SpeechBubble>
  );
}
