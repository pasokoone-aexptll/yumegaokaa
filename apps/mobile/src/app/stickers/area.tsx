import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Alert, Modal, Text, View } from "react-native";
import { Camera, Boundary, Map } from "../../components/map/PlatformMap";
import { Action, Empty, Page, ui } from "../../components/Page";
import { LocationPicker } from "../../components/LocationPicker";
import { native, streetID } from "../../lib/native";
import { mapStyle } from "../../lib/mapStyle";
import { submitCommand } from "../../lib/commands";
import { StickerDraft } from "../../lib/stickers";
type Placement = {
  tag_id: string;
  title: string;
  longitude: number;
  latitude: number;
  active: boolean;
  retired: boolean;
  revision: number;
};
type Preview = {
  valid: boolean;
  id?: string;
  area_version: number;
  boundary?: GeoJSON.Polygon;
};
export default function Area() {
  const router = useRouter();
  const [placements, setPlacements] = useState<Placement[]>([]),
    [drafts, setDrafts] = useState<StickerDraft[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [preview, setPreview] = useState<Preview>(),
    [moving, setMoving] = useState<Placement>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    const [p, d] = await Promise.all([
      native.rpc<{ items: Placement[] }>("placement_list", {
        street_id: streetID,
      }),
      native.rpc<{ items: StickerDraft[] }>("sticker_list", {
        street_id: streetID,
      }),
    ]);
    setPlacements(p.items);
    setDrafts(d.items.filter((x) => x.phase === "installed"));
    setSelected(
      d.items.filter((x) => x.phase === "installed").map((x) => x.id),
    );
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load().catch(() =>
        setError("取得できません。運営認証と通信を確認してください。"),
      );
    }, [load]),
  );
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch {
      setError("完了を確認できません。状態を再取得してください。");
    } finally {
      setBusy(false);
    }
  }
  async function move(point: [number, number]) {
    if (!moving) return;
    await run(async () => {
      const r = await submitCommand<{ id: string }>("sticker_create", {
        street_id: streetID,
        title: moving.title,
        tag_id: moving.tag_id,
        longitude: point[0],
        latitude: point[1],
      });
      setMoving(undefined);
      setPreview(undefined);
      router.push({ pathname: "/stickers/[id]", params: { id: r.id } });
    });
  }
  async function replaceSticker(p: Placement) {
    await run(async () => {
      const r = await submitCommand<{ id: string }>("sticker_create", {
        street_id: streetID,
        title: p.title,
        replaces_tag: p.tag_id,
        longitude: p.longitude,
        latitude: p.latitude,
      });
      setPreview(undefined);
      router.push({ pathname: "/stickers/[id]", params: { id: r.id } });
    });
  }
  return (
    <Page title="街の範囲">
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action
        title="最新の設置状態を取得"
        disabled={busy}
        onPress={() =>
          void run(async () => {
            await load();
            setPreview(undefined);
          })
        }
      />
      {drafts.map((d) => (
        <Action
          key={d.id}
          title={(selected.includes(d.id) ? "✓ " : "") + d.title}
          disabled={busy}
          onPress={() => {
            setSelected((ids) =>
              ids.includes(d.id)
                ? ids.filter((id) => id !== d.id)
                : [...ids, d.id],
            );
            setPreview(undefined);
          }}
        />
      ))}
      <Action
        title="変更後の範囲を見る"
        disabled={busy}
        onPress={() =>
          void run(async () =>
            setPreview(
              await native.rpc<Preview>("sticker_preview", {
                street_id: streetID,
                draft_ids: selected,
              }),
            ),
          )
        }
      />
      {preview && !preview.valid && (
        <Empty>
          範囲を作れません。一直線に並ばない3地点以上が必要です。公開中の範囲は維持されます。
        </Empty>
      )}
      {preview?.boundary && (
        <View style={{ height: 300, borderRadius: 20, overflow: "hidden" }}>
          <Map style={{ flex: 1 }} mapStyle={mapStyle}>
            <Camera
              initialViewState={{
                center: preview.boundary.coordinates[0][0] as [number, number],
                zoom: 14,
              }}
            />
            <Boundary data={preview.boundary} />
          </Map>
        </View>
      )}
      {preview?.valid && (
        <Action
          title="この範囲を公開"
          disabled={busy}
          onPress={() =>
            Alert.alert(
              "街の範囲を公開しますか？",
              "選択したステッカーを有効にします。",
              [
                { text: "戻る", style: "cancel" },
                {
                  text: "公開",
                  onPress: () =>
                    void run(async () => {
                      await native.rpc("sticker_publish", { id: preview.id });
                      setPreview(undefined);
                      await load();
                    }),
                },
              ],
            )
          }
        />
      )}
      {placements.map((p) => (
        <View key={p.tag_id} style={ui.card}>
          <Text>
            {p.title} · {p.retired ? "廃止" : p.active ? "有効" : "停止中"}
          </Text>
          {!p.retired && (
            <>
              <Action
                title="移設する"
                disabled={busy}
                onPress={() => setMoving(p)}
              />
              <Action
                title="新しいステッカーに交換"
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "交換用ステッカーを準備しますか？",
                    "新タグの設置と範囲公開が完了すると、旧タグを廃止します。紛失した旧タグは先に停止してください。",
                    [
                      { text: "戻る", style: "cancel" },
                      {
                        text: "準備する",
                        onPress: () => void replaceSticker(p),
                      },
                    ],
                  )
                }
              />
              {p.active && (
                <Action
                  title="ステッカーを停止"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      "このステッカーを停止しますか？",
                      "新規入街を止めます。街の範囲は公開し直すまで変わりません。",
                      [
                        { text: "戻る", style: "cancel" },
                        {
                          text: "停止",
                          style: "destructive",
                          onPress: () =>
                            void run(async () => {
                              await native.rpc("sticker_suspend", {
                                tag_id: p.tag_id,
                                revision: p.revision,
                              });
                              setPreview(undefined);
                              await load();
                            }),
                        },
                      ],
                    )
                  }
                />
              )}
            </>
          )}
        </View>
      ))}
      <Modal
        visible={!!moving}
        animationType="slide"
        onRequestClose={() => setMoving(undefined)}
      >
        {moving && (
          <LocationPicker
            initial={[moving.longitude, moving.latitude]}
            onCancel={() => setMoving(undefined)}
            onConfirm={(p) =>
              Alert.alert(
                "移設を開始しますか？",
                "現在のステッカーを停止し、新しい場所での再読取と設置確認へ進みます。",
                [
                  { text: "戻る", style: "cancel" },
                  { text: "開始", onPress: () => void move(p) },
                ],
              )
            }
          />
        )}
      </Modal>
    </Page>
  );
}
