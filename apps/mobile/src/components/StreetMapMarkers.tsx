import { RecruitmentIcon } from "./RecruitmentIcon";
import { UIIcon } from "./icons/UIIcon";
import {
  PinBubble,
  PinCountdown,
  PinGradientText,
  pinRed,
} from "./map/PinLabel";
import { EventCloudPin } from "./EventCloudPin";
import { MarkerFeedback } from "./map/MarkerFeedback";
import { Avatar } from "./Avatar";
import { Marker } from "./map/PlatformMap";
import { router } from "expo-router";
import { View } from "react-native";
import { StreetEvent, countdown } from "../lib/events";
import { Recruitment } from "../lib/recruitments";
import { liveCells } from "../lib/presence";
import { streetMapStyles as styles } from "./streetMapStyles";

export function StreetMapMarkers({
  cells,
  events,
  recruitments,
  now,
  onSelect,
}: {
  cells: ReturnType<typeof liveCells>;
  events: StreetEvent[];
  recruitments: Recruitment[];
  now: number;
  onSelect: (longitude: number, latitude: number) => void;
}) {
  return (
    <>
      {cells.map((cell) => (
        <Marker
          key={`${cell.area_version}:${cell.cell_id}`}
          lngLat={[cell.anchor.longitude, cell.anchor.latitude]}
        >
          <View style={styles.clusterRow}>
            {cell.clusters.map((cluster, i) => (
              <MarkerFeedback
                key={i}
                accessibilityLabel={`ここに${cluster.count}人の気配`}
                style={[
                  styles.presence,
                  {
                    transform: [{ translateY: i % 2 ? 20 : 0 }],
                  },
                ]}
              >
                <PinBubble>
                  <PinGradientText>{`ここに${cluster.count}人の気配`}</PinGradientText>
                </PinBubble>
                <View style={styles.clusterRow}>
                  {cluster.opacities.map((opacity, slot) => (
                    <View
                      key={slot}
                      style={[
                        styles.orb,
                        {
                          opacity,
                          backgroundColor: [
                            "#b8d6ff",
                            "#d8c4ff",
                            "#ffd0df",
                            "#bde5dc",
                            "#ffe1ad",
                            "#c8d3f7",
                          ][slot % 6],
                        },
                      ]}
                    >
                      {cluster.icons[slot] ? (
                        <Avatar
                          bucket="street-icons"
                          path={cluster.icons[slot] ?? undefined}
                          name=""
                          size={38}
                        />
                      ) : (
                        <UIIcon name="presence-star" size={30} />
                      )}
                    </View>
                  ))}
                </View>
              </MarkerFeedback>
            ))}
          </View>
        </Marker>
      ))}
      {events
        .filter((e) => Date.parse(e.ends_at) > now)
        .map((event) => (
          <Marker key={event.id} lngLat={[event.longitude, event.latitude]}>
            <MarkerFeedback
              accessibilityRole="button"
              onPress={() => {
                onSelect(event.longitude, event.latitude);
                router.push({
                  pathname: "/map-event",
                  params: { id: event.id, fromMap: "1" },
                });
              }}
              style={{ alignItems: "center", maxWidth: 180 }}
            >
              <PinCountdown>{countdown(event, now)}</PinCountdown>
              <PinBubble>
                <PinGradientText
                  colors={pinRed}
                >{event.title}</PinGradientText>
              </PinBubble>
              <View style={{ alignItems: "center" }}>
                <EventCloudPin />
              </View>
            </MarkerFeedback>
          </Marker>
        ))}
      {recruitments
        .filter((p) => Date.parse(p.expires_at) > now)
        .map((pin) => (
          <Marker key={pin.id} lngLat={[pin.longitude, pin.latitude]}>
            <MarkerFeedback
              onPress={() => {
                onSelect(pin.longitude, pin.latitude);
                router.push({
                  pathname: "/map-recruitment",
                  params: { id: pin.id, fromMap: "1" },
                });
              }}
              accessibilityRole="button"
            >
              <PinBubble>
                <PinGradientText>{`${pin.display_name}が募集中`}</PinGradientText>
              </PinBubble>
              <RecruitmentIcon pin={pin} />
            </MarkerFeedback>
          </Marker>
        ))}
    </>
  );
}
