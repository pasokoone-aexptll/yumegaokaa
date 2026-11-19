import { onsitePeople, DenshinPin } from "../lib/denshin";
import {
  PeopleStack,
  RecruitmentSign,
  RecruitmentGlyph,
} from "./denshin/PinParts";
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
import { useRouter, usePathname, useGlobalSearchParams } from "expo-router";
import { useRef } from "react";
import { requireNativeModule } from "expo-modules-core";
import { Platform, View, Text } from "react-native";
import { StreetEvent, countdown } from "../lib/events";
import { Recruitment } from "../lib/recruitments";
import { liveCells } from "../lib/presence";
import { streetMapStyles as styles } from "./streetMapStyles";

export function StreetMapMarkers({
  cells,
  pins = [],
  events,
  recruitments,
  now,
  onSelect,
}: {
  cells: ReturnType<typeof liveCells>;
  pins?: DenshinPin[];
  events: StreetEvent[];
  recruitments: Recruitment[];
  now: number;
  onSelect: (longitude: number, latitude: number) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ id?: string }>();
  const lastTap = useRef(0);
  function openDetail(
    kind: "event" | "recruitment" | "denshin",
    id: string,
    longitude: number,
    latitude: number,
  ) {
    // This function runs only from marker onPress handlers, never during render.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (now - lastTap.current < 300) return;
    lastTap.current = now;
    const target =
      kind === "denshin"
        ? "/map-pin"
        : kind === "event"
          ? "/map-event"
          : "/map-recruitment";
    if (pathname === target && params.id === id) {
      if (router.canDismiss()) router.dismiss();
      return;
    }
    if (Platform.OS === "android")
      void requireNativeModule("PresenceNative")
        .selectionHaptic()
        .catch(() => {});
    onSelect(longitude, latitude);
    const destination = {
      pathname: target,
      params: { id, fromMap: "1" },
    } as const;
    if (["/map-pin", "/map-event", "/map-recruitment"].includes(pathname))
      router.replace(destination);
    else router.push(destination);
  }
  return (
    <>
      {cells.map((cell) => (
        <Marker
          key={`${cell.area_version}:${cell.cell_id}`}
          snapshotKey={JSON.stringify(cell.clusters)}
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
      {pins
        .filter((p) => Date.parse(p.expires_at) > now)
        .map((pin) => (
          <Marker
            key={pin.id}
            snapshotKey={JSON.stringify(pin)}
            lngLat={[pin.longitude, pin.latitude]}
            onPress={
              Platform.OS === "android"
                ? () =>
                    openDetail("denshin", pin.id, pin.longitude, pin.latitude)
                : undefined
            }
          >
            <MarkerFeedback
              pointerEvents={Platform.OS === "android" ? "none" : "auto"}
              accessibilityRole="button"
              accessibilityLabel={pin.body}
              onPress={
                Platform.OS === "android"
                  ? undefined
                  : () =>
                      openDetail("denshin", pin.id, pin.longitude, pin.latitude)
              }
              style={{ alignItems: "center", maxWidth: 210, padding: 8 }}
            >
              {pin.recruiting && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "ui-rounded",
                    fontWeight: "700",
                    fontSize: 13,
                    alignSelf: "flex-start",
                    marginLeft: 8,
                    marginBottom: 5,
                  }}
                >
                  {pin.display_name} ・{" "}
                  <Text style={{ fontSize: 16 }}>{pin.count}</Text>
                  <Text style={{ fontSize: 10 }}>
                    {pin.capacity === null ? "人" : `/${pin.capacity}人`}
                  </Text>
                </Text>
              )}
              <PinBubble>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  {pin.recruiting && <RecruitmentGlyph />}
                  <View style={{ flexShrink: 1 }}>
                    <PinGradientText
                      colors={
                        pin.recruiting ? undefined : ["#858990", "#a5a7ac"]
                      }
                    >
                      {pin.body}
                    </PinGradientText>
                  </View>
                </View>
              </PinBubble>
              {pin.recruiting ? (
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      position: "absolute",
                      right: -45,
                      top: -12,
                      zIndex: 2,
                    }}
                  >
                    <PeopleStack people={onsitePeople(pin)} />
                  </View>
                  <RecruitmentSign />
                </View>
              ) : (
                <View
                  style={{
                    borderWidth: 5,
                    borderColor: "rgba(255,255,255,0.25)",
                    borderRadius: 18,
                  }}
                >
                  <Avatar
                    shape="square"
                    path={pin.avatar_path}
                    name={pin.display_name}
                    size={54}
                  />
                </View>
              )}
            </MarkerFeedback>
          </Marker>
        ))}
      {events
        .filter((e) => Date.parse(e.ends_at) > now)
        .map((event) => (
          <Marker
            key={event.id}
            snapshotKey={event.title + countdown(event, now)}
            lngLat={[event.longitude, event.latitude]}
            onPress={
              Platform.OS === "android"
                ? () =>
                    openDetail(
                      "event",
                      event.id,
                      event.longitude,
                      event.latitude,
                    )
                : undefined
            }
          >
            <MarkerFeedback
              pointerEvents={Platform.OS === "android" ? "none" : "auto"}
              accessibilityRole="button"
              onPress={
                Platform.OS === "android"
                  ? undefined
                  : () =>
                      openDetail(
                        "event",
                        event.id,
                        event.longitude,
                        event.latitude,
                      )
              }
              style={{ alignItems: "center", maxWidth: 180 }}
            >
              <PinCountdown>{countdown(event, now)}</PinCountdown>
              <PinBubble>
                <PinGradientText colors={pinRed}>{event.title}</PinGradientText>
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
          <Marker
            key={pin.id}
            snapshotKey={pin.display_name + pin.icon_path}
            lngLat={[pin.longitude, pin.latitude]}
            onPress={
              Platform.OS === "android"
                ? () =>
                    openDetail(
                      "recruitment",
                      pin.id,
                      pin.longitude,
                      pin.latitude,
                    )
                : undefined
            }
          >
            <MarkerFeedback
              pointerEvents={Platform.OS === "android" ? "none" : "auto"}
              onPress={
                Platform.OS === "android"
                  ? undefined
                  : () =>
                      openDetail(
                        "recruitment",
                        pin.id,
                        pin.longitude,
                        pin.latitude,
                      )
              }
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
