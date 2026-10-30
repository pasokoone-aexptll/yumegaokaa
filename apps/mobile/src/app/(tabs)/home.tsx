import { PinListItem } from "../../components/PinListItem";
import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { Action, Empty, Page, ui } from "../../components/Page";
import { useHomePins } from "../../hooks/useHomePins";
export default function Home() {
  const [tab, setTab] = useState("参加予定のピン");
  const { items, recruitments, error, loading, load } = useHomePins();
  return (
    <Page
      title="ピン一覧"
      headerAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ピンを作成"
          onPress={() => router.push("/pins/create")}
          style={{
            backgroundColor: "#ff4e60",
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 24,
          }}
        >
          <Text style={{ color: "white", fontSize: 17, fontWeight: "700" }}>
            ＋ 作成
          </Text>
        </Pressable>
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 24 }}
      >
        {["参加予定のピン", "募集中のピン"].map((x) => (
          <Pressable
            key={x}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === x }}
            onPress={() => setTab(x)}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: tab === x ? "#008cff" : "transparent",
            }}
          >
            <Text
              style={{
                color: tab === x ? "#008cff" : "#87929b",
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              {x}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {!!error && <Text style={ui.error}>{error}</Text>}
      {tab === "参加予定のピン" ? (
        loading ? (
          <Empty>読み込み中…</Empty>
        ) : items.length ? (
          items.map((e) => (
            <PinListItem
              key={e.id}
              title={e.title}
              subtitle={new Date(e.starts_at).toLocaleString()}
              longitude={e.longitude}
              latitude={e.latitude}
              onOpen={() =>
                router.push({ pathname: "/events/[id]", params: { id: e.id } })
              }
            />
          ))
        ) : (
          !error && <Empty>参加予定のオフ会はありません。</Empty>
        )
      ) : loading ? (
        <Empty>読み込み中…</Empty>
      ) : recruitments.length ? (
        recruitments.map((p) => (
          <PinListItem
            key={p.id}
            title={p.title}
            subtitle={`${p.display_name} が募集中`}
            longitude={p.longitude}
            latitude={p.latitude}
            onOpen={() =>
              router.push({
                pathname: "/recruitments/[id]",
                params: { id: p.id },
              })
            }
          />
        ))
      ) : (
        !error && <Empty>募集中のピンはありません。</Empty>
      )}
      <Action title="再読み込み" onPress={() => void load()} />
    </Page>
  );
}
