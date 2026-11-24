import { DenshinMapPin } from "./pins/DenshinMapPin";
import { onsitePeople, DenshinPin } from "../lib/denshin";
import { RecruitmentIcon } from "./RecruitmentIcon";
import { SuperAsset } from "./icons/SuperAsset";
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
import { Platform, View } from "react-native";
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
                <View style={styles.presenceIcons}>
                  {cluster.opacities.map((opacity, slot) => (
                    <View
                      key={slot}
                      style={[
                        styles.orb,
                        {
                          opacity,
                          marginLeft: slot === 0 ? 0 : -22,
                          marginTop:
                            cluster.count === 1
                              ? 0
                              : cluster.count === 2
                                ? slot * 4
                                : slot % 3 === 1
                                  ? 0
                                  : slot % 3 === 0
                                    ? 5
                                    : 8,
                          zIndex: slot + 1,
                          backgroundColor: "rgba(255,255,255,0.15)",
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
                        <SuperAsset
                          name="user-fill"
                          size={30}
                          tint="white"
                          opacity={0.6}
                        />
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
            live={Platform.OS === "android"}
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
            >
              <DenshinMapPin pin={pin} people={onsitePeople(pin)} />
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
            live={Platform.OS === "android"}
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
