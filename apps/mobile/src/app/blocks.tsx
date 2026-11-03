import { localBlocks } from "../lib/localBlocks";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text } from "react-native";
import { DetailPage, DetailRow, Section } from "../components/DetailUI";
import { Empty, ui } from "../components/Page";
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
  const writing = useRef(false);
  const [busy, setBusy] = useState(false);
  async function unblock(id: string) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    try {
      await native.rpc("block_set", { account_id: id, blocked: false });
      localBlocks.set(id, false);
      await refresh();
    } catch {
      setError("解除できませんでした。再試行してください。");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <DetailPage title="ブロック設定" refreshing={loading} onRefresh={refresh}>
      <Text style={ui.muted}>
        ブロックすると相手のチャット・入街ログ・募集を表示しません。街の人数や匿名の気配は変わりません。
      </Text>
      {!!error && <Text style={ui.error}>{error}</Text>}
      {loading ? (
        <Empty>読み込み中…</Empty>
      ) : !error && !items.length ? (
        <Empty>ブロックしている人はいません。</Empty>
      ) : null}
      <Section>
        {items.map((i) => (
          <DetailRow
            key={i.account_id}
            title={i.display_name}
            subtitle={busy ? "更新中…" : "タップしてブロックを解除"}
            onPress={busy ? undefined : () => void unblock(i.account_id)}
          />
        ))}
      </Section>
    </DetailPage>
  );
}
