import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { Action, Empty, Page, ui } from "../components/Page";
import { native } from "../lib/native";
type Block = { account_id: string; display_name: string };
export default function Blocks() {
  const [items, setItems] = useState<Block[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await native.rpc<{ items: Block[] }>("block_list", {})).items);
      setError("");
    } catch {
      setError("取得できませんでした。ログインと通信を確認してください。");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  async function unblock(id: string) {
    try {
      await native.rpc("block_set", { account_id: id, blocked: false });
      await refresh();
    } catch {
      setError("解除できませんでした。再試行してください。");
    }
  }
  return (
    <Page title="ブロック設定">
      <Text style={ui.muted}>
        ブロックすると相手のチャット・入街ログ・募集を表示しません。街の人数や匿名の気配は変わりません。
      </Text>
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action title="再読み込み" onPress={() => void refresh()} />
      {loading ? (
        <Empty>読み込み中…</Empty>
      ) : !error && !items.length ? (
        <Empty>ブロックしている人はいません。</Empty>
      ) : null}
      {items.map((i) => (
        <View key={i.account_id} style={ui.card}>
          <Text>{i.display_name}</Text>
          <Action title="解除" onPress={() => void unblock(i.account_id)} />
        </View>
      ))}
    </Page>
  );
}
