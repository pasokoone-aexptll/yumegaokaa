import { useEffect } from "react";
import { NativeToggle as Switch } from "../components/denshin/NativeToggle";
import { NativeAction } from "../components/denshin/NativeAction";
import { SuperAsset } from "../components/icons/SuperAsset";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDenshinDetail } from "../hooks/useDenshinDetail";
import { Avatar } from "../components/Avatar";
import { PinSheet } from "../components/denshin/PinSheet";
import {
  PeopleStack,
  PinHeading,
  RecruitBadge,
  RoundAction,
  green,
} from "../components/denshin/PinParts";
import { editDenshin } from "../lib/denshinDraft";
import { onsitePeople, pinCount, PinPerson } from "../lib/denshin";
import { native } from "../lib/native";
import { localBlocks } from "../lib/localBlocks";
import { openMapAt } from "../lib/mapNavigation";
export default function PinDetail() {
  const { id = "", fromMap } = useLocalSearchParams<{
    id: string;
    fromMap?: string;
  }>();
  const router = useRouter(),
    insets = useSafeAreaInsets();
  const d = useDenshinDetail(id);
  const { confirmed, setConfirmed } = d;
  useEffect(() => {
    if (confirmed) {
      setConfirmed(false);
      router.push({ pathname: "/pin-confirmed", params: { id } });
    }
  }, [confirmed, setConfirmed, router, id]);
  const p = d.pin;
  const disabled = d.busy || !!d.pending;
  function mode(next: boolean) {
    if (!next && p?.count)
      Alert.alert(
        "募集を終了しますか？",
        "全員の参加・到着状態を解除して通知します。本文は残ります。",
        [
          { text: "戻る", style: "cancel" },
          { text: "募集を終了", onPress: () => void d.mode(false, true) },
        ],
      );
    else void d.mode(next);
  }
  async function report() {
    try {
      await native.rpc("report_create", {
        target_kind: "denshin",
        target_id: id,
        reason: "other",
        description: "",
      });
      Alert.alert("通報を受け付けました");
    } catch {
      Alert.alert("通報できませんでした", "接続を確認して再試行してください。");
    }
  }
  async function block() {
    if (!p) return;
    try {
      await native.rpc("block_set", { account_id: p.author_id, blocked: true });
      localBlocks.set(p.author_id, true);
      router.back();
    } catch {
      Alert.alert("ブロックできませんでした");
    }
  }
  const person = (x: PinPerson, host = false) => (
    <View key={x.account_id} style={s.person}>
      <Avatar
        path={x.avatar_path}
        name={x.display_name}
        size={38}
        shape="square"
      />
      <Text style={s.name}>
        {x.display_name}
        {host ? "\n（ホスト）" : ""}
      </Text>
    </View>
  );
  return (
    <PinSheet>
      {d.loading && <ActivityIndicator color="white" />}
      {d.confirmed && p ? (
        <View style={s.confirm}>
          <RoundAction label="閉じる" glyph="×" onPress={() => router.back()} />
          <Avatar path={p.avatar_path} name={p.display_name} size={80} />
          <RecruitBadge />
          <Text style={s.title}>{p.body}</Text>
          <SuperAsset name="checkRounded" size={58} />
          <Text style={s.title}>参加確定</Text>
          <Pressable style={s.button} onPress={() => d.setConfirmed(false)}>
            <Text style={s.buttonText}>詳細へ戻る</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={[
              s.content,
              { paddingBottom: insets.bottom + 115 },
            ]}
          >
            <View style={s.header}>
              <PinHeading />
              <RoundAction
                label="閉じる"
                glyph="×"
                onPress={() => router.back()}
              />
            </View>
            {!!d.error && (
              <Text accessibilityRole="alert" style={s.error}>
                {d.error}
              </Text>
            )}
            {d.ended && (
              <Text style={s.muted}>
                この電信PINは終了したか、表示できなくなりました。
              </Text>
            )}
            {d.pending && (
              <NativeAction
                tone="neutral"
                title={d.busy ? "通信を確認中…" : "通信を確認"}
                disabled={d.busy}
                onPress={() => Alert.alert(
                  "変更が保存されたか確認できません",
                  "再試行しても同じ変更が二重に保存されることはありません。送信をやめる場合も、すでに保存された変更は残ります。",
                  [
                    { text: "閉じる", style: "cancel" },
                    { text: "送信をやめる", onPress: () => void d.recover(true) },
                    { text: "再試行", onPress: () => void d.recover(false) },
                  ],
                )}
              />
            )}
            {p && !d.ended && (
              <>
                <View style={s.identity}>
                  <Avatar
                    path={p.avatar_path}
                    name={p.display_name}
                    size={64}
                    shape="square"
                  />
                  {p.recruiting && <RecruitBadge />}
                </View>
                <View style={s.summary}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>{p.body}</Text>
                    <Text style={s.muted}>
                      {p.mine ? "自分" : p.display_name}
                      {p.recruiting ? ` ・ ${pinCount(p)}` : ""}
                    </Text>
                  </View>
                  {p.recruiting && <PeopleStack people={onsitePeople(p)} />}
                </View>
                {p.mine && (
                  <View style={s.toggle}>
                    <Text style={s.title}>募集モード</Text>
                    <Switch
                      accessibilityLabel="募集モード"
                      disabled={disabled}
                      value={p.recruiting}
                      onValueChange={mode}
                      trackColor={{ true: green }}
                    />
                  </View>
                )}
                {p.recruiting && (
                  <>
                    <Text style={s.section}>主催者</Text>
                    {person({
                      account_id: p.author_id,
                      display_name: p.display_name,
                      avatar_path: p.avatar_path,
                      state: "planned",
                    })}
                    <Text style={s.section}>現地にいる人</Text>
                    {onsitePeople(p).map((x) => person(x))}
                    {onsitePeople(p).length === 0 && (
                      <Text style={s.muted}>まだいません</Text>
                    )}
                    <Text style={s.section}>参加予定</Text>
                    {p.people
                      .filter((x) => x.state === "planned")
                      .map((x) => person(x))}
                    {!p.people.some((x) => x.state === "planned") && (
                      <Text style={s.muted}>まだいません</Text>
                    )}
                    {!p.mine && p.attendance === "planned" && (
                      <Pressable
                        disabled={disabled}
                        onPress={() => void d.attend("left")}
                      >
                        <Text style={s.link}>参加予定を取り消す</Text>
                      </Pressable>
                    )}
                  </>
                )}
                {!fromMap && (
                  <Pressable
                    onPress={() =>
                      openMapAt(router, p.longitude, p.latitude, {
                        kind: "denshin",
                        id,
                      })
                    }
                  >
                    <Text style={s.link}>マップで見る</Text>
                  </Pressable>
                )}
                {p.mine ? (
                  <View style={s.management}>
                    <RoundAction
                      label="編集する"
                      glyph="✎"
                      disabled={disabled}
                      onPress={() => {
                        editDenshin(p);
                        router.push("/pins/create");
                      }}
                    />
                    <Pressable
                      disabled={disabled}
                      onPress={() =>
                        Alert.alert(
                          "電信PINを削除しますか？",
                          "参加者へ終了を通知します。今日の作成枠は戻りません。",
                          [
                            { text: "戻る", style: "cancel" },
                            {
                              text: "削除",
                              style: "destructive",
                              onPress: () => void d.remove(),
                            },
                          ],
                        )
                      }
                    >
                      <Text style={s.error}>削除する</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={s.management}>
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "この電信PINを通報しますか？",
                          "内容を運営へ送信します。",
                          [
                            { text: "戻る", style: "cancel" },
                            { text: "通報", onPress: () => void report() },
                          ],
                        )
                      }
                    >
                      <Text style={s.muted}>通報</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "このユーザーをブロックしますか？",
                          "PINを非表示にします。参加中の場合はHomeから取消できます。",
                          [
                            { text: "戻る", style: "cancel" },
                            { text: "ブロック", onPress: () => void block() },
                          ],
                        )
                      }
                    >
                      <Text style={s.muted}>ブロック</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </ScrollView>
          {p?.recruiting && !p.mine && !d.ended && (
            <View
              style={{
                position: "absolute",
                bottom: insets.bottom + 16,
                left: 24,
                right: 24,
                zIndex: 10,
              }}
            >
              <NativeAction
                tone={!p.mine && p.attendance === "left" ? "neutral" : "green"}
                title={
                  p.attendance === "planned"
                    ? "現地につきました"
                    : p.attendance === "arrived"
                      ? "現地を離れる"
                      : p.capacity !== null && p.count >= p.capacity
                        ? "満員です"
                        : "参加する！"
                }
                disabled={
                  disabled ||
                  (!p.mine &&
                    p.attendance === "left" &&
                    p.capacity !== null &&
                    p.count >= p.capacity)
                }
                onPress={() => {
                  void d.attend(
                    p.attendance === "left"
                      ? "planned"
                      : p.attendance === "planned"
                        ? "arrived"
                        : "left",
                  );
                }}
              />
            </View>
          )}
        </>
      )}
    </PinSheet>
  );
}
const s = StyleSheet.create({
  header: {
    padding: 0,
    flexShrink: 0,
    paddingTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: { padding: 22, gap: 14 },
  identity: { flexDirection: "row", gap: 18, alignItems: "center" },
  summary: { flexDirection: "row", gap: 10, alignItems: "center" },
  title: { color: "white", fontSize: 21, lineHeight: 29 },
  muted: { color: "#ffffff88", fontSize: 14, lineHeight: 21 },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 28,
    backgroundColor: "#ffffff22",
  },
  section: { color: "#ffffffaa", fontSize: 14, marginTop: 15 },
  person: { flexDirection: "row", gap: 10, alignItems: "center" },
  name: { color: "#ffffffbb", fontSize: 15 },
  button: {
    backgroundColor: "#ffffffbb",
    padding: 17,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { fontSize: 18, color: "#27303a", fontWeight: "600" },
  link: { color: "white", paddingVertical: 12, fontSize: 16 },
  error: { color: "#ffd0d0", fontSize: 15 },
  management: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  group: { gap: 5 },
  confirm: {
    flex: 1,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  check: { fontSize: 56, color: green },
});
