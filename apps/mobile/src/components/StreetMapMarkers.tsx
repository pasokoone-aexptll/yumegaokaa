import { Marker } from "@maplibre/maplibre-react-native";
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
                accessibilityLabel={`このあたりに${cluster.count}人`}
                style={[
                  styles.presence,
                  {
                    transform: [{ translateY: i % 2 ? 20 : 0 }],
                  },
                ]}
              >
                <Text style={styles.bubble}>このあたりに{cluster.count}人</Text>
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
                      <Text style={styles.orbSymbol}>✦</Text>
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
              style={{
                backgroundColor: "white",
                padding: 8,
                borderRadius: 16,
                maxWidth: 180,
              }}
            >
              <Text style={{ color: "#ff4f88", fontWeight: "700" }}>
                {countdown(event, now)}
              </Text>
              <Text numberOfLines={1}>{event.title}</Text>
              <Text
                style={{
                  fontSize: 25,
                  color: "#ff5d9c",
                  textAlign: "center",
                }}
              >
                ☁︎
              </Text>
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
              style={{
                backgroundColor: "white",
                padding: 8,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#4799ff" }}>
                {pin.display_name} が募集中
              </Text>
              <Text>{pin.title}</Text>
              <Text style={{ textAlign: "center", color: "#469fff" }}>●</Text>
            </Pressable>
          </Marker>
        ))}
    </>
  );
}
