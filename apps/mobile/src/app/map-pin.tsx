import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { pinCount, PinPerson } from "../lib/denshin";
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
      <Avatar path={x.avatar_path} name={x.display_name} size={38} />
      <Text style={s.name}>
        {x.display_name}
        {host ? "\n（ホスト）" : ""}
      </Text>
    </View>
  );
  return (
    <PinSheet>
      <View style={s.header}>
        <PinHeading />
        <RoundAction label="閉じる" glyph="×" onPress={() => router.back()} />
      </View>
      {d.loading && <ActivityIndicator color="white" />}
      {d.confirmed && p ? (
        <View style={s.confirm}>
          <Avatar path={p.avatar_path} name={p.display_name} size={80} />
          <RecruitBadge />
          <Text style={s.title}>{p.body}</Text>
          <Text style={s.check}>✓</Text>
          <Text style={s.title}>参加確定</Text>
          <Pressable style={s.button} onPress={() => d.setConfirmed(false)}>
            <Text style={s.buttonText}>詳細へ戻る</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            s.content,
            { paddingBottom: insets.bottom + 28 },
          ]}
        >
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
            <View style={s.group}>
              <Text style={s.muted}>
                未確認の送信があります。結果を確認してから次の操作を行えます。
              </Text>
              <Pressable
                disabled={d.busy}
                onPress={() => void d.recover(false)}
              >
                <Text style={s.link}>同じ内容で再試行</Text>
              </Pressable>
              <Pressable disabled={d.busy} onPress={() => void d.recover(true)}>
                <Text style={s.link}>送信結果を確認して取り消す</Text>
              </Pressable>
            </View>
          )}
          {p && !d.ended && (
            <>
              <View style={s.identity}>
                <Avatar path={p.avatar_path} name={p.display_name} size={64} />
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
                {p.recruiting && <PeopleStack people={p.people} />}
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
                  <Text style={s.section}>現地にいる人</Text>
                  {p.host_arrived &&
                    person(
                      {
                        account_id: p.author_id,
                        display_name: p.display_name,
                        avatar_path: p.avatar_path,
                        state: "arrived",
                      },
                      true,
                    )}
                  {p.people
                    .filter((x) => x.state === "arrived")
                    .map((x) => person(x))}
                  {!p.host_arrived &&
                    !p.people.some((x) => x.state === "arrived") && (
                      <Text style={s.muted}>まだいません</Text>
                    )}
                  <Text style={s.section}>参加予定</Text>
                  {p.people
                    .filter((x) => x.state === "planned")
                    .map((x) => person(x))}
                  {!p.people.some((x) => x.state === "planned") && (
                    <Text style={s.muted}>まだいません</Text>
                  )}
                  {p.mine ? (
                    <Pressable
                      disabled={disabled}
                      style={s.button}
                      onPress={() => void d.host()}
                    >
                      <Text style={s.buttonText}>
                        {p.host_arrived ? "現地を離れる" : "現地につきました"}
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        disabled={
                          disabled ||
                          (p.attendance === "left" &&
                            p.capacity !== null &&
                            p.count >= p.capacity)
                        }
                        style={[
                          s.button,
                          p.attendance === "planned" && {
                            backgroundColor: green,
                          },
                          disabled && { opacity: 0.5 },
                        ]}
                        onPress={() =>
                          void d.attend(
                            p.attendance === "left"
                              ? "planned"
                              : p.attendance === "planned"
                                ? "arrived"
                                : "left",
                          )
                        }
                      >
                        <Text style={s.buttonText}>
                          {p.attendance === "planned"
                            ? "✓ 現地につきました"
                            : p.attendance === "arrived"
                              ? "現地を離れる"
                              : p.capacity !== null && p.count >= p.capacity
                                ? "満員です"
                                : "参加する！"}
                        </Text>
                      </Pressable>
                      {p.attendance === "planned" && (
                        <Pressable
                          disabled={disabled}
                          onPress={() => void d.attend("left")}
                        >
                          <Text style={s.link}>参加予定を取り消す</Text>
                        </Pressable>
                      )}
                    </>
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
                  <Text style={s.link}>⌖ マップで見る</Text>
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
      )}
    </PinSheet>
  );
}
const s = StyleSheet.create({
  header: {
    padding: 20,
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
