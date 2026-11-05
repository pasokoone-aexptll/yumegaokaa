import { homeEvents } from "../../lib/homeEvents";
import { useState } from "react";
import {
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PinListItem } from "../../components/PinListItem";
import { MapAsset } from "../../components/map/MapAsset";
import { useHomePins } from "../../hooks/useHomePins";

export default function Home() {
  const { items, recruitments, error, loading, load } = useHomePins();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }
  const events = homeEvents(items);
  return (
    <ScrollView
      style={s.page}
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          tintColor="#000000"
          progressViewOffset={insets.top}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
        />
      }
    >
      <ImageBackground
        source={require("../../../assets/figma-map/yuuyake.png")}
        style={[s.hero, { height: insets.top + 150, paddingTop: insets.top }]}
      >
        <View style={s.shade} />
        <MapAsset
          name="DreamCloud Logo"
          width={210}
          height={32}
          tint="#ffffffcc"
        />
      </ImageBackground>
      <View style={s.content}>
        <View style={s.headingRow}>
          <Text style={s.heading}>参加予定</Text>
        </View>
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        {!loading && !error && !events.joined.length && (
          <Text style={s.empty}>参加予定のオフ会はありません。</Text>
        )}
        {events.joined.map((e, index, joined) => {
          const date = new Date(e.starts_at);
          const dateLabel = date.toLocaleDateString("ja-JP", {
            month: "long",
            day: "numeric",
            weekday: "short",
          });
          const previous = index
            ? new Date(joined[index - 1].starts_at).toLocaleDateString(
                "ja-JP",
                { month: "long", day: "numeric", weekday: "short" },
              )
            : null;
          return (
            <View key={e.id}>
              {dateLabel !== previous && (
                <Text style={s.date}>{dateLabel}</Text>
              )}
              <PinListItem
                title={e.title}
                subtitle={`${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} — ${new Date(e.ends_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`}
                longitude={e.longitude}
                latitude={e.latitude}
                detail={{ kind: "event", id: e.id }}
                onOpen={() =>
                  router.push({
                    pathname: "/events/[id]",
                    params: { id: e.id },
                  })
                }
              />
            </View>
          );
        })}
        <Text style={[s.heading, { marginTop: 28, marginBottom: 8 }]}>
          街のイベント
        </Text>
        {!loading && !error && !events.discover.length && (
          <Text style={s.empty}>未参加のイベントはありません。</Text>
        )}
        {events.discover.map((e) => (
          <PinListItem
            key={e.id}
            title={e.title}
            subtitle={new Date(e.starts_at).toLocaleString("ja-JP", {
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            longitude={e.longitude}
            latitude={e.latitude}
            detail={{ kind: "event", id: e.id }}
            onOpen={() =>
              router.push({ pathname: "/events/[id]", params: { id: e.id } })
            }
          />
        ))}
        <Text style={[s.heading, { marginTop: 28, marginBottom: 8 }]}>
          募集中
        </Text>
        {!loading && !error && !recruitments.length && (
          <Text style={s.empty}>募集中のピンはありません。</Text>
        )}
        {recruitments.map((p) => (
          <PinListItem
            key={p.id}
            title={p.title}
            subtitle={`${p.display_name} が募集中`}
            longitude={p.longitude}
            latitude={p.latitude}
            detail={{ kind: "recruitment", id: p.id }}
            onOpen={() =>
              router.push({
                pathname: "/recruitments/[id]",
                params: { id: p.id },
              })
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "white" },
  hero: {
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "#00000020" },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { fontSize: 25, fontWeight: "600", color: "#000000e6" },
  date: {
    fontSize: 17,
    fontWeight: "500",
    color: "#00000088",
    marginTop: 22,
    marginBottom: 4,
  },
  empty: {
    fontSize: 16,
    lineHeight: 24,
    color: "#00000066",
    paddingVertical: 20,
  },
  error: { fontSize: 15, color: "#c22", paddingVertical: 12 },
});
