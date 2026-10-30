import { router } from "expo-router";
import { Modal, Text, TextInput, View } from "react-native";
import { Action, Empty, Page, ui } from "../../components/Page";
import { LocationPicker } from "../../components/LocationPicker";
import { useStickerRegistration } from "../../hooks/useStickerRegistration";
export default function Stickers() {
  const {
    items,
    loading,
    load,
    title,
    setTitle,
    point,
    setPoint,
    selecting,
    setSelecting,
    busy,
    error,
    pending,
    create,
    cancelPending,
  } = useStickerRegistration();
  return (
    <Page title="ステッカー">
      <Action
        title="街の範囲・移設・停止"
        onPress={() => router.push("/stickers/area")}
      />
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action
        title="登録一覧を再取得"
        disabled={busy || loading}
        onPress={() => void load()}
      />
      {loading && <Empty>読み込み中…</Empty>}
      <View style={ui.card}>
        <TextInput
          style={ui.input}
          placeholder="管理名"
          value={title}
          onChangeText={setTitle}
          maxLength={50}
          editable={!busy && !pending}
        />
        <Action
          title={point ? "設置場所を変更" : "設置場所を選択"}
          disabled={busy || !!pending}
          onPress={() => setSelecting(true)}
        />
        <Action
          title={pending ? "保存した登録を再試行" : "登録を開始"}
          disabled={busy || !title.trim() || !point}
          onPress={() => void create()}
        />
        {!!pending && (
          <Action
            title="登録を取り消す"
            disabled={busy}
            onPress={() => void cancelPending()}
          />
        )}
      </View>
      {!loading && !items.length && !error && <Empty>登録はありません。</Empty>}
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
