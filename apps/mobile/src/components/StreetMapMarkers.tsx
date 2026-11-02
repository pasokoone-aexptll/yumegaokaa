import { SmoothSurface } from "./map/SmoothSurface";
import { EventCloudPin } from "./EventCloudPin";
import { Avatar } from "./Avatar";
import { Marker } from "./map/PlatformMap";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { StreetEvent, countdown } from "../lib/events";
import { Recruitment } from "../lib/recruitments";
import { liveCells } from "../lib/presence";
import { streetMapStyles as styles } from "./streetMapStyles";

export function StreetMapMarkers({
  cells,
  events,
  recruitments,
  now,
}: {
  cells: ReturnType<typeof liveCells>;
  events: StreetEvent[];
  recruitments: Recruitment[];
  now: number;
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
              <View
                key={i}
                accessible
                accessibilityLabel={`ここに${cluster.count}人の気配`}
                style={[
                  styles.presence,
                  {
                    transform: [{ translateY: i % 2 ? 20 : 0 }],
                  },
                ]}
              >
                <SmoothSurface color="#f4f4f4" radius={15}>
                  <Text style={styles.bubble}>
                    ここに{cluster.count}人の気配
                  </Text>
                </SmoothSurface>
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
                        <Text style={styles.orbSymbol}>✦</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </Marker>
      ))}
      {events
        .filter((e) => Date.parse(e.ends_at) > now)
        .map((event) => (
          <Marker key={event.id} lngLat={[event.longitude, event.latitude]}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/events/[id]",
                  params: { id: event.id },
                })
              }
              style={{ alignItems: "center", maxWidth: 180 }}
            >
              <SmoothSurface
                color="#ff426d"
                radius={16}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: "white", fontSize: 16 }}>
                  {countdown(event, now)}
                </Text>
              </SmoothSurface>
              <SmoothSurface
                color="#fff"
                radius={14}
                style={{ paddingHorizontal: 10, paddingVertical: 5 }}
              >
                <Text
                  numberOfLines={1}
                  style={{ color: "#ff5d91", fontSize: 16 }}
                >
                  ▦ {event.title}
                </Text>
              </SmoothSurface>
              <View style={{ alignItems: "center" }}>
                <EventCloudPin />
              </View>
            </Pressable>
          </Marker>
        ))}
      {recruitments
        .filter((p) => Date.parse(p.expires_at) > now)
        .map((pin) => (
          <Marker key={pin.id} lngLat={[pin.longitude, pin.latitude]}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/recruitments/[id]",
                  params: { id: pin.id },
                })
              }
              accessibilityRole="button"
            >
              <SmoothSurface color="white" radius={16} style={{ padding: 8 }}>
                <Text style={{ color: "#4799ff" }}>
                  {pin.display_name} が募集中
                </Text>
                <Text>{pin.title}</Text>
                <Text style={{ textAlign: "center", color: "#469fff" }}>●</Text>
              </SmoothSurface>
            </Pressable>
          </Marker>
        ))}
    </>
  );
}
