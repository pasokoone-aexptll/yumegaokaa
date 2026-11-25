import { imageReport } from "../lib/imageReport";
import { PinSheetFooter } from "../components/denshin/PinSheetFooter";
import { useEffect } from "react";
import { NativeToggle as Switch } from "../components/denshin/NativeToggle";
import { NativeAction } from "../components/denshin/NativeAction";
import { SuperAsset } from "../components/icons/SuperAsset";
import {
  Platform,
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
import { PinAuthorMenu } from "../components/denshin/PinAuthorMenu";
import { PinSheet } from "../components/denshin/PinSheet";
import {
  PeopleStack,
  PinHeading,
  RecruitBadge,
  RoundAction,
  green,
} from "../components/denshin/PinParts";
import { editDenshin } from "../lib/denshinDraft";
import { onsitePeople, PinPerson } from "../lib/denshin";
import { native } from "../lib/native";
import { localBlocks } from "../lib/localBlocks";
import { openMapAt } from "../lib/mapNavigation";
export default function PinDetail() {
  const { id = "", fromMap } = useLocalSearchParams<{
    id: string;
    fromMap?: string;
  }>();
  const data = useDenshinDetail(id);
  return <PinDetailView data={data} id={id} fromMap={fromMap} />;
}
export function PinDetailView({
  data: d,
  id,
  fromMap,
  readOnly = false,
}: {
  data: ReturnType<typeof useDenshinDetail>;
  id: string;
  fromMap?: string;
  readOnly?: boolean;
}) {
  const router = useRouter(),
    insets = useSafeAreaInsets();

  const { confirmed, setConfirmed } = d;
  useEffect(() => {
    if (confirmed && !readOnly) {
      setConfirmed(false);
      router.push({ pathname: "/pin-confirmed", params: { id } });
    }
  }, [confirmed, setConfirmed, router, id, readOnly]);
  const p = d.pin;
  const disabled = d.busy || !!d.pending;
  const onsite = p ? onsitePeople(p) : [];
  const planned =
    p?.people.filter((person) => person.state === "planned") ?? [];
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
    if (readOnly) return;
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
    if (readOnly) return;
    if (!p) return;
    try {
      await native.rpc("block_set", { account_id: p.author_id, blocked: true });
      localBlocks.set(p.author_id, true);
      router.back();
    } catch {
      Alert.alert("ブロックできませんでした");
    }
  }
  const confirmReport = () =>
    Alert.alert("この電信PINを通報しますか？", "内容を運営へ送信します。", [
      { text: "戻る", style: "cancel" },
      { text: "通報", onPress: () => void report() },
    ]);
  const confirmBlock = () =>
    Alert.alert(
      "このユーザーをブロックしますか？",
      "PINを非表示にします。参加中の場合はHomeから取消できます。",
      [
        { text: "戻る", style: "cancel" },
        { text: "ブロック", onPress: () => void block() },
      ],
    );
  const authorAvatar = p && (
    <Pressable
      disabled={readOnly || p.mine || !p.avatar_path}
      accessibilityRole="button"
      accessibilityLabel="プロフィール画像を通報"
      onPress={() =>
        p.avatar_path &&
        router.push(imageReport("profile_image", [p.avatar_path]))
      }
    >
      <Avatar
        path={p.avatar_path}
        name={p.display_name}
        size={64}
        shape="square"
      />
    </Pressable>
  );
  const person = (x: PinPerson) => (
    <Pressable
      key={x.account_id}
      style={s.person}
      disabled={readOnly || !x.avatar_path}
      accessibilityLabel={x.display_name + "のプロフィール画像を通報"}
      accessibilityRole="button"
      onPress={() =>
        x.avatar_path &&
        router.push(imageReport("profile_image", [x.avatar_path]))
      }
    >
      <Avatar
        path={x.avatar_path}
        name={x.display_name}
        size={36}
        shape="square"
      />
      <Text style={s.name}>{x.display_name}</Text>
    </Pressable>
  );
  return (
    <PinSheet>
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
              <View style={s.headerActions}>
                {p && !p.mine && !d.ended && (
                  <PinAuthorMenu
                    onReport={confirmReport}
                    onBlock={confirmBlock}
                  />
                )}
                <RoundAction
                  label="閉じる"
                  glyph="×"
                  onPress={() => router.back()}
                />
              </View>
            </View>
            {d.loading && <ActivityIndicator color="white" />}
            {!!d.error && (
              <Text accessibilityLiveRegion="polite" style={s.muted}>
                {d.error}
              </Text>
            )}
            {d.ended && (
              <Text style={s.muted}>
                この電信PINは終了したか、表示できなくなりました。
              </Text>
            )}
            {p && !d.ended && (
              <>
                <View style={s.identity}>
                  {authorAvatar}
                  {p.recruiting && (
                    <View style={s.identityBadge}>
                      <RecruitBadge />
                    </View>
                  )}
                </View>
                <View style={s.summary}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[s.title, s.halfTitle]}>{p.body}</Text>
                    <Text style={s.muted}>
                      {p.mine ? "自分" : p.display_name}
                      {p.recruiting && (
                        <>
                          {" ・ "}
                          {p.count}
                          <Text style={s.capacity}>
                            {p.capacity === null ? "人" : `/${p.capacity}人`}
                          </Text>
                        </>
                      )}
                    </Text>
                  </View>
                  {p.recruiting && <PeopleStack people={onsitePeople(p)} />}
                </View>
                {p.mine && (
                  <View style={s.toggle}>
                    <View style={s.toggleLabel}>
                      <SuperAsset
                        name="非常口rounded"
                        size={21}
                        tint="white"
                        opacity={0.65}
                      />
                      <Text style={s.controlLabel}>募集モード</Text>
                    </View>
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
                    <View style={s.roster}>
                      <Text style={s.section}>主催者</Text>
                      {person({
                        account_id: p.author_id,
                        display_name: p.display_name,
                        avatar_path: p.avatar_path,
                        state: "planned",
                      })}
                    </View>
                    {onsite.length > 0 && (
                      <View style={s.roster}>
                        <Text style={s.section}>現地にいる人</Text>
                        <View style={s.group}>{onsite.map(person)}</View>
                      </View>
                    )}
                    {planned.length > 0 && (
                      <View style={s.roster}>
                        <Text style={s.section}>参加予定</Text>
                        <View style={s.group}>{planned.map(person)}</View>
                      </View>
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
              </>
            )}
          </ScrollView>
          <PinSheetFooter active={!!p && !d.ended && (p.mine || p.recruiting)}>
            {p?.mine && !d.ended && (
              <View
                style={{
                  position: "absolute",
                  right: 28,
                  bottom: 28,
                }}
              >
                <RoundAction
                  label="編集する"
                  size={52}
                  glyph="✎"
                  disabled={disabled || readOnly}
                  onPress={() => {
                    editDenshin(p);
                    router.replace("/pins/create");
                  }}
                />
              </View>
            )}
            {p?.recruiting && !p.mine && !d.ended && (
              <View
                style={{
                  position: "absolute",
                  bottom: 28,
                  width: p.attendance === "left" ? 140 : 220,
                  right: 28,
                  zIndex: 10,
                }}
              >
                <NativeAction
                  onDark
                  leadingIcon={p.attendance === "planned" ? "check" : undefined}
                  contentWidth={p.attendance === "left" ? 96 : 170}
                  tone={
                    !p.mine && p.attendance === "left" ? "neutral" : "green"
                  }
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
          </PinSheetFooter>
        </>
      )}
    </PinSheet>
  );
}
const s = StyleSheet.create({
  header: {
    padding: 0,
    flexShrink: 0,
    paddingTop: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: -8,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === "android" ? 10 : 16,
    gap: 14,
  },
  identity: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    marginBottom: -8,
  },
  identityBadge: { transform: [{ translateY: 5 }] },
  summary: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: "ui-rounded",
    color: "white",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 29,
  },
  halfTitle: { fontSize: 24, lineHeight: 32 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  muted: {
    fontFamily: "ui-rounded",
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
  },
  capacity: {
    fontSize: 11,
    ...(Platform.OS === "android" ? { fontWeight: "800" as const } : {}),
  },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
    marginHorizontal: -8,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  toggleLabel: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  controlLabel: {
    fontFamily: "ui-rounded",
    color: "rgba(255,255,255,0.65)",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    flexShrink: 1,
  },
  section: { color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: "500" },
  roster: { gap: 10, marginTop: 6 },
  person: { flexDirection: "row", gap: 10, alignItems: "center" },
  name: {
    fontFamily: "ui-rounded",
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600",
  },
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
