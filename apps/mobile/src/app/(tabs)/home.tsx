import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Action, Empty, Page, ui } from "../../components/Page";
import { useHomePins } from "../../hooks/useHomePins";
export default function Home() {
  const [tab, setTab] = useState("参加予定のピン");
  const { items, recruitments, error, loading, load } = useHomePins();
  return (
    <Page title="ピン一覧">
      <Action title="ピンを作成" onPress={() => router.push("/pins/create")} />
      <View style={{ flexDirection: "row", gap: 20 }}>
        {["参加予定のピン", "募集中のピン"].map((x) => (
          <Pressable key={x} onPress={() => setTab(x)}>
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
      </View>
      {!!error && <Text style={ui.error}>{error}</Text>}
      {tab === "参加予定のピン" ? (
        loading ? (
          <Empty>読み込み中…</Empty>
        ) : items.length ? (
          items.map((e) => (
            <Pressable
              key={e.id}
              onPress={() =>
                router.push({ pathname: "/events/[id]", params: { id: e.id } })
              }
              style={ui.card}
            >
              <Text style={{ fontSize: 22, fontWeight: "700" }}>{e.title}</Text>
              <Text>{new Date(e.starts_at).toLocaleString()}</Text>
              <Text style={ui.muted}>詳細を見る ›</Text>
            </Pressable>
          ))
        ) : (
          !error && <Empty>参加予定のオフ会はありません。</Empty>
        )
      ) : loading ? (
        <Empty>読み込み中…</Empty>
      ) : recruitments.length ? (
        recruitments.map((p) => (
          <Pressable
            key={p.id}
            style={ui.card}
            onPress={() =>
              router.push({
                pathname: "/recruitments/[id]",
                params: { id: p.id },
              })
            }
          >
            <Text>{p.title}</Text>
            <Text>{p.display_name} が募集中</Text>
          </Pressable>
        ))
      ) : (
        !error && <Empty>募集中のピンはありません。</Empty>
      )}
      <Action title="再読み込み" onPress={() => void load()} />
    </Page>
  );
}
