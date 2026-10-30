import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Modal, Text, TextInput, View } from "react-native";
import { Action, Empty, Page, ui } from "../../components/Page";
import { LocationPicker } from "../../components/LocationPicker";
import { native, streetID } from "../../lib/native";
import { submitCommand } from "../../lib/commands";
import { StickerDraft } from "../../lib/stickers";
export default function Stickers() {
  const [items, setItems] = useState<StickerDraft[]>([]),
    [title, setTitle] = useState(""),
    [point, setPoint] = useState<[number, number]>(),
    [selecting, setSelecting] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await native.rpc<{ items: StickerDraft[] }>("sticker_list", {
        street_id: streetID,
      });
      setItems(r.items);
      setError("");
    } catch {
      setError("運営の追加認証と通信を確認してください。");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function create() {
    if (!point) return;
    setBusy(true);
    try {
      const r = await submitCommand<{ id: string }>("sticker_create", {
        street_id: streetID,
        title: title.trim(),
        longitude: point[0],
        latitude: point[1],
      });
      setTitle("");
      setPoint(undefined);
      router.push({ pathname: "/stickers/[id]", params: { id: r.id } });
    } catch {
      setError("登録できません。同じ内容で再試行してください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="ステッカー">
      <Action
        title="街の範囲・移設・停止"
        onPress={() => router.push("/stickers/area")}
      />
      {!!error && <Text style={ui.error}>{error}</Text>}
      <View style={ui.card}>
        <TextInput
          style={ui.input}
          placeholder="管理名"
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />
        <Action
          title={point ? "設置場所を変更" : "設置場所を選択"}
          onPress={() => setSelecting(true)}
        />
        <Action
          title="登録を開始"
          disabled={busy || !title.trim() || !point}
          onPress={() => void create()}
        />
      </View>
      {!items.length && !error && <Empty>登録はありません。</Empty>}
      {items.map((d) => (
        <Action
          key={d.id}
          title={
            d.title +
            " · " +
            {
              draft: "書込待ち",
              written: "照合待ち",
              verified: "設置待ち",
              installed: "公開待ち",
              published: "公開済み",
            }[d.phase]
          }
          onPress={() =>
            router.push({ pathname: "/stickers/[id]", params: { id: d.id } })
          }
        />
      ))}
      <Modal
        visible={selecting}
        animationType="slide"
        onRequestClose={() => setSelecting(false)}
      >
        <LocationPicker
          initial={point}
          onCancel={() => setSelecting(false)}
          onConfirm={(p) => {
            setPoint(p);
            setSelecting(false);
          }}
        />
      </Modal>
    </Page>
  );
}
