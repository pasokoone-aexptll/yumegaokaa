import { mapStyle } from "../../lib/mapStyle";
import "react-native-url-polyfill/auto";
import { StreetChat } from "../../components/StreetChat";
import { Recruitment } from "../../lib/recruitments";
import { StreetEvent, countdown } from "../../lib/events";
import { router, useLocalSearchParams } from "expo-router";
import { closeMenu, setToolsButtonVisible } from "expo-dev-client";
import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  CameraRef,
  Map,
  Marker,
} from "@maplibre/maplibre-react-native";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import {
  key,
  displayClock,
  native,
  NativeState,
  Snapshot,
  streetID,
  url,
} from "../../lib/native";
import { liveCells } from "../../lib/presence";

import { localEntry, nfcDisabled } from "../../lib/development";
const initial: NativeState = {
  observing: false,
  status: "未参加",
  pending_exit: false,
  visit: {},
};
const friendly = (error: unknown) => {
  const s = String(error);
  if (s.includes("otp_expired"))
    return "確認コードが無効か期限切れです。新しいコードを送信してください。";
  if (s.includes("credential_storage_failed"))
    return "認証情報を端末に保存できませんでした。アプリを開き直してお試しください。";
  if (s.includes("membership_required"))
    return "このアカウントはまだ招待登録されていません。開発環境では運営用コマンドで登録してください。";
  if (s.includes("location_permission_required"))
    return "位置情報を許可してから、もう一度入街してください。設定アプリで許可を変更できます。";
  if (s.includes("operation_in_progress"))
    return "参加状態を確認中です。少し待ってからお試しください。";
  if (s.includes("inactive_tag")) return "このステッカーは現在使えません。";
  if (s.includes("wrong_writer"))
    return "別の端末で参加しています。この端末で参加するにはNFCにタッチしてください。";
  return "接続または参加状態を確認できませんでした。もう一度お試しください。";
};
export default function Street() {
  const camera = useRef<CameraRef>(null);
  const params = useLocalSearchParams<{
    longitude?: string;
    latitude?: string;
  }>();
  const [events, setEvents] = useState<StreetEvent[]>([]);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  useEffect(() => {
    const lon = Number(params.longitude),
      lat = Number(params.latitude);
    if (
      params.longitude &&
      params.latitude &&
      Number.isFinite(lon) &&
      Number.isFinite(lat)
    )
      camera.current?.flyTo({ center: [lon, lat], zoom: 16, duration: 600 });
  }, [params.longitude, params.latitude]);
  async function recenter() {
    try {
      const p = await native.currentLocation();
      camera.current?.flyTo({
        center: [p.longitude, p.latitude],
        zoom: 16,
        duration: 500,
      });
    } catch {
      setError(
        "現在地を取得できませんでした。位置情報の許可と接続アプリの版を確認してください。",
      );
    }
  }
  const [ready, setReady] = useState(!url || !key),
    [signed, setSigned] = useState(false),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false);
  const [state, setState] = useState(initial),
    [snapshot, setSnapshot] = useState<Snapshot>(),
    [now, setNow] = useState(0),
    [name, setName] = useState("夢ヶ丘");
  const [error, setError] = useState(
      !url || !key
        ? "開発接続設定がありません。npm run setup:local を実行してください。"
        : "",
    ),
    [busy, setBusy] = useState(false),
    [sheet, setSheet] = useState<
      "explain" | "scanning" | "checking" | "success" | null
    >(null),
    [settings, setSettings] = useState(false);
  const canceled = useRef(false),
    fetching = useRef(false),
    refreshQueued = useRef(false),
    clock = useRef({ server: 0, local: 0 }),
    snapshotGeneration = useRef(0);
  const invalidateSnapshot = useCallback(() => {
    snapshotGeneration.current++;
    refreshQueued.current = false;
  }, []);
  const refresh = useCallback(async (): Promise<void> => {
    if (fetching.current) {
      refreshQueued.current = true;
      return;
    }
    refreshQueued.current = false;
    fetching.current = true;
    const generation = snapshotGeneration.current;
    try {
      const synced = await displayClock();
      const s = await native.rpc<Snapshot>("get_presence_snapshot", {
        street_id: streetID,
      });
      if (generation !== snapshotGeneration.current) return;
      clock.current = synced;
      setNow(synced.server + native.monotonicTime() - synced.local);
      setSnapshot(s);
      const config = await native.rpc<{ name: string }>("get_street_config", {
        street_id: streetID,
      });
      if (generation !== snapshotGeneration.current) return;
      setName(config.name);
      const pins = await native.rpc<{ items: StreetEvent[] }>("event_list", {
        street_id: streetID,
      });
      if (generation !== snapshotGeneration.current) return;
      setEvents(pins.items);
      const recruiting = await native.rpc<{ items: Recruitment[] }>(
        "recruitment_list",
        { street_id: streetID },
      );
      if (generation !== snapshotGeneration.current) return;
      setRecruitments(recruiting.items);
      setError("");
    } catch (e) {
      if (generation !== snapshotGeneration.current) return;
      setError(friendly(e));
      if (
        ["membership_required", "unauthorized", "login_required"].some((x) =>
          String(e).includes(x),
        )
      )
        setSnapshot(undefined);
    } finally {
      fetching.current = false;
      if (refreshQueued.current && generation === snapshotGeneration.current) {
        refreshQueued.current = false;
        void refresh();
      }
    }
  }, []);
  useEffect(() => {
    if (__DEV__) {
      setToolsButtonVisible(false);
      closeMenu();
    }
    if (!url || !key) return;
    native
      .configure(url, key)
      .then(() => native.session())
      .then((s) => {
        setSigned(s.signed_in);
        setEmail(s.email);
        setReady(true);
      })
      .catch((e) => {
        setError(friendly(e));
        setReady(true);
      });
    const listener = native.addListener("onChange", (s) => setState(s));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (!signed) return;
    native
      .resume()
      .then((s) => {
        setState(s);
        void refresh();
      })
      .catch((e) => setError(friendly(e)));
    const realtime = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      accessToken: () => native.realtimeToken(),
    });
    let disposed = false;
    const channel = realtime
      .channel(`street:${streetID}`, { config: { private: true } })
      .on("broadcast", { event: "changed" }, () => void refresh());
    void realtime.realtime
      .setAuth()
      .then(() => {
        if (!disposed)
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") void refresh();
          });
      })
      .catch(() => {});
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 10000);
    const ticker = setInterval(
      () =>
        setNow(
          clock.current.server + native.monotonicTime() - clock.current.local,
        ),
      1000,
    );
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        void refresh();
        native
          .resume()
          .then(setState)
          .catch(() => {});
      }
    });
    return () => {
      invalidateSnapshot();
      clearInterval(timer);
      clearInterval(ticker);
      sub.remove();
      disposed = true;
      void realtime.removeChannel(channel);
    };
  }, [signed, refresh, invalidateSnapshot]);
  async function login() {
    setBusy(true);
    setError("");
    try {
      if (sent) {
        await native.verifyOTP(email.trim(), code.trim());
        setSigned(true);
      } else {
        await native.sendOTP(email.trim());
        setSent(true);
      }
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }
  async function exit() {
    canceled.current = true;
    setSheet(null);
    const stopping = native.stop();
    await NfcManager.cancelTechnologyRequest().catch(() => {});
    try {
      setState(await stopping);
      await refresh();
    } catch {
      setError("端末の観測は停止しました。退出は通信回復後に反映します。");
    }
  }
  async function enterFixture() {
    canceled.current = false;
    setSheet("checking");
    setError("");
    try {
      const result = await native.checkin(
        "22222222-2222-4222-8222-222222222222",
      );
      if (!canceled.current) {
        setState(result);
        setSheet("success");
        await refresh();
      }
    } catch (e) {
      if (!canceled.current) {
        setError(friendly(e));
        setSheet(null);
      }
    }
  }
  async function scan() {
    if (nfcDisabled && !localEntry) {
      setError(
        "この構成はローカルAPIに接続したDebugビルドで使用してください。",
      );
      setSheet(null);
      return;
    }
    if (localEntry) {
      await enterFixture();
      return;
    }
    canceled.current = false;
    setSheet("scanning");
    setError("");
    try {
      await NfcManager.start();
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: "夢ヶ丘のステッカーにiPhoneの上部を近づけてください",
      });
      const tag = await NfcManager.getTag();
      const record = tag?.ndefMessage?.find((r) =>
        Ndef.isType(r, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT),
      );
      if (!record) throw new Error("invalid_tag");
      const text = Ndef.text.decodePayload(Uint8Array.from(record.payload));
      const payload = JSON.parse(text);
      if (
        payload.v !== 1 ||
        typeof payload.tag_id !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(payload.tag_id)
      )
        throw new Error("invalid_tag");
      await NfcManager.cancelTechnologyRequest();
      if (canceled.current) return;
      setSheet("checking");
      const s = await native.checkin(payload.tag_id);
      if (!canceled.current) {
        setState(s);
        setSheet(null);
        await refresh();
      }
    } catch (e) {
      if (!canceled.current) {
        setError(friendly(e));
        setSheet(null);
      }
    } finally {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  }

  async function writeTestTag() {
    Alert.alert(
      "開発用ステッカーを設定",
      "この操作はステッカーの内容を上書きします。空のテスト用ステッカーだけを使ってください。実際の街への公開登録ではありません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "空のテスト用タグに書き込む",
          onPress: () =>
            void (async () => {
              try {
                await NfcManager.start();
                await NfcManager.requestTechnology(NfcTech.Ndef, {
                  alertMessage: "空のテスト用ステッカーにタッチ",
                });
                const before = await NfcManager.getTag();
                if (before?.ndefMessage?.length)
                  throw new Error("tag_not_empty");
                const text = JSON.stringify({
                  v: 1,
                  tag_id: "22222222-2222-4222-8222-222222222222",
                });
                const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
                if (!bytes) throw new Error("invalid_tag");
                await NfcManager.ndefHandler.writeNdefMessage(bytes);
                await NfcManager.cancelTechnologyRequest();
                Alert.alert(
                  "書き込み完了",
                  "次に街のスイッチをONにし、同じタグを読み取ってください。",
                );
              } catch (e) {
                Alert.alert(
                  "書き込めませんでした",
                  String(e).includes("tag_not_empty")
                    ? "データが入っているタグは上書きしません。空のタグを使ってください。"
                    : "NDEF形式で書き込み可能なタグか確認してください。",
                );
              } finally {
                await NfcManager.cancelTechnologyRequest().catch(() => {});
              }
            })(),
        },
      ],
    );
  }
  const active =
    state.visit.state === "active" &&
    state.visit.can_update === true &&
    !state.pending_exit &&
    (!state.visit.expires_at || Date.parse(state.visit.expires_at) > now);
  if (!ready)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (!signed)
    return (
      <SafeAreaView style={styles.login}>
        <Text style={styles.logo}>夢ヶ丘</Text>
        <Text style={styles.subtitle}>街の気配を感じる、第六感。</Text>
        <Text style={styles.label}>招待されたメールでログイン</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardType="email-address"
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
        />
        {sent && (
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="メールの確認コード"
            value={code}
            onChangeText={setCode}
          />
        )}
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          disabled={busy || !email}
          onPress={login}
        >
          <Text style={styles.buttonText}>
            {busy ? "確認中…" : sent ? "ログイン" : "確認コードを送る"}
          </Text>
        </Pressable>
        {sent && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              setSent(false);
              setCode("");
              setError("");
            }}
          >
            <Text style={styles.link}>メールアドレスを確認・コードを再送</Text>
          </Pressable>
        )}
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.note}>
          ローカル開発では、メールはMacのMailpitに届きます。
        </Text>
      </SafeAreaView>
    );
  const cells = snapshot ? liveCells(snapshot, now) : [];
  return (
    <View style={styles.root}>
      <Map style={StyleSheet.absoluteFill} mapStyle={mapStyle}>
        <Camera
          ref={camera}
          initialViewState={{ center: [139.7109, 35.7295], zoom: 15 }}
        />
        {cells.map((cell) => (
          <Marker
            key={`${cell.area_version}:${cell.cell_id}`}
            lngLat={[cell.anchor.longitude, cell.anchor.latitude]}
          >
            <View style={styles.clusterRow}>
              {cell.clusters.map((cluster, i) => (
                <View
                  key={i}
                  accessible
                  accessibilityLabel={`このあたりに${cluster.count}人`}
                  style={[
                    styles.presence,
                    {
                      transform: [{ translateY: i % 2 ? 20 : 0 }],
                    },
                  ]}
                >
                  <Text style={styles.bubble}>
                    このあたりに{cluster.count}人
                  </Text>
                  <View style={styles.clusterRow}>
                    {cluster.opacities.map((opacity, slot) => (
                      <View
                        key={slot}
                        style={[
                          styles.orb,
                          {
                            opacity,
                            backgroundColor: [
                              "#b8d6ff",
                              "#d8c4ff",
                              "#ffd0df",
                              "#bde5dc",
                              "#ffe1ad",
                              "#c8d3f7",
                            ][slot % 6],
                          },
                        ]}
                      >
                        <Text style={styles.orbSymbol}>✦</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </Marker>
        ))}
        {events
          .filter((e) => Date.parse(e.ends_at) > now)
          .map((event) => (
            <Marker key={event.id} lngLat={[event.longitude, event.latitude]}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/events/[id]",
                    params: { id: event.id },
                  })
                }
                style={{
                  backgroundColor: "white",
                  padding: 8,
                  borderRadius: 16,
                  maxWidth: 180,
                }}
              >
                <Text style={{ color: "#ff4f88", fontWeight: "700" }}>
                  {countdown(event, now)}
                </Text>
                <Text numberOfLines={1}>{event.title}</Text>
                <Text
                  style={{
                    fontSize: 25,
                    color: "#ff5d9c",
                    textAlign: "center",
                  }}
                >
                  ☁︎
                </Text>
              </Pressable>
            </Marker>
          ))}
        {recruitments
          .filter((p) => Date.parse(p.expires_at) > now)
          .map((pin) => (
            <Marker key={pin.id} lngLat={[pin.longitude, pin.latitude]}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/recruitments/[id]",
                    params: { id: pin.id },
                  })
                }
                style={{
                  backgroundColor: "white",
                  padding: 8,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: "#4799ff" }}>
                  {pin.display_name} が募集中
                </Text>
                <Text>{pin.title}</Text>
                <Text style={{ textAlign: "center", color: "#469fff" }}>●</Text>
              </Pressable>
            </Marker>
          ))}
      </Map>
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.logo}>{name}</Text>
          <Switch
            accessibilityLabel="街への参加"
            value={active}
            onValueChange={(v) => (v ? setSheet("explain") : void exit())}
            trackColor={{ true: "#28c967" }}
          />
        </View>
        {localEntry && (
          <Text style={styles.note}>開発用：NFC読取のみボタンで代用</Text>
        )}
        <View style={styles.people}>
          <Text style={styles.peopleText}>
            ✦{" "}
            {snapshot
              ? `${snapshot.checked_in_count}人がチェックイン中${error ? "（最終取得時）" : ""}`
              : "街の様子を確認中…"}
          </Text>
        </View>
        <View style={styles.status}>
          <Text>{state.status}</Text>
          {state.visit.can_update === false &&
            state.visit.state === "active" && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSheet("explain")}
              >
                <Text style={styles.link}>
                  {localEntry ? "開発用の入街を開始" : "この端末でNFCを読む"}
                </Text>
              </Pressable>
            )}
        </View>
        <View style={{ alignSelf: "flex-end", gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="現在地へ戻る"
            onPress={() => void recenter()}
            style={{ backgroundColor: "white", borderRadius: 30, padding: 18 }}
          >
            <Text style={{ fontSize: 22 }}>➤</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ピンを追加"
            onPress={() => router.push("/pins/create")}
            style={{ backgroundColor: "white", borderRadius: 30, padding: 18 }}
          >
            <Text style={{ fontSize: 22 }}>＋</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }} pointerEvents="none" />
        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
        <StreetChat />
        <View style={styles.bottom}>
          <Text style={styles.note}>
            {!snapshot
              ? "街の気配を取得しています。通信状態を確認してください。"
              : cells.length
                ? "話しかけなくても、ここに誰かの気配。"
                : "今見える気配はありません。人がいないとは限りません。"}
          </Text>
          <Text style={styles.note}>気配は10分で薄くなって消えます。</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSettings(true)}
          >
            <Text style={styles.link}>アカウント・接続状態</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() =>
          sheet === "success" ? setSheet(null) : void exit()
        }
      >
        <View style={styles.shade}>
          <View style={styles.sheet}>
            <Text style={styles.heading}>
              {sheet === "success"
                ? "街への参加が完了しました"
                : sheet === "explain"
                  ? "街に参加する"
                  : sheet === "scanning"
                    ? "ステッカーにタッチ"
                    : "街への参加を記録中"}
            </Text>
            <Text style={styles.cloud}>{sheet === "success" ? "✓" : "☁︎"}</Text>
            <Text style={styles.subtitle}>
              {sheet === "success"
                ? "街の気配を感じながら、自由に過ごしてください。"
                : sheet === "explain"
                  ? "参加中は画面を閉じても、このあたりにいる気配を共有します。名前や正確な現在地は地図に出ません。OFFで停止できます。"
                  : localEntry
                    ? "開発用タグから本物と同じDB/APIへ入街を記録しています。"
                    : "NFC読取にはiPhone標準の画面が開きます。読み取り後はステッカーから離して大丈夫です。"}
            </Text>
            {sheet === "success" ? (
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                onPress={() => setSheet(null)}
              >
                <Text style={styles.buttonText}>地図へ</Text>
              </Pressable>
            ) : sheet === "explain" ? (
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                onPress={scan}
              >
                <Text style={styles.buttonText}>
                  {localEntry ? "開発用タグで入街（NFC代用）" : "NFCを読み取る"}
                </Text>
              </Pressable>
            ) : (
              <ActivityIndicator size="large" />
            )}
            {sheet !== "success" && (
              <Pressable accessibilityRole="button" onPress={() => void exit()}>
                <Text style={styles.link}>キャンセル</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
      <Modal visible={settings} animationType="slide">
        <SafeAreaView style={styles.login}>
          <Text style={styles.heading}>アカウント</Text>
          <Text>{email}</Text>
          <Text style={styles.note}>開発用接続: {url}</Text>
          <Text>{state.status}</Text>
          {__DEV__ && !nfcDisabled && (
            <Pressable accessibilityRole="button" onPress={writeTestTag}>
              <Text style={styles.link}>開発用の空NFCタグを設定</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={async () => {
              snapshotGeneration.current++;
              refreshQueued.current = false;
              await native.logout();
              setSnapshot(undefined);
              setEvents([]);
              setRecruitments([]);
              setState(initial);
              setSigned(false);
              setSettings(false);
              setSent(false);
              setCode("");
              setEmail("");
            }}
          >
            <Text style={styles.buttonText}>ログアウト</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSettings(false)}
          >
            <Text style={styles.link}>地図に戻る</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#def4ff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  login: {
    flex: 1,
    padding: 28,
    gap: 20,
    justifyContent: "center",
    backgroundColor: "#f4fbff",
  },
  logo: { fontSize: 27, fontWeight: "900", color: "#3265ff", maxWidth: "80%" },
  subtitle: { fontSize: 16, lineHeight: 26, color: "#526372" },
  label: { fontSize: 15, color: "#425566" },
  input: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    fontSize: 18,
  },
  button: {
    backgroundColor: "#078bff",
    padding: 18,
    borderRadius: 26,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: { fontSize: 18, fontWeight: "700", color: "white" },
  error: { color: "#ac354b", lineHeight: 22 },
  note: { fontSize: 12, color: "#627c8b", lineHeight: 19 },
  overlay: { flex: 1, paddingHorizontal: 18 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  people: {
    backgroundColor: "#fffffff0",
    borderRadius: 30,
    padding: 15,
    marginTop: 15,
  },
  peopleText: { fontSize: 17, color: "#55616d" },
  status: {
    alignSelf: "flex-start",
    padding: 10,
    backgroundColor: "#ffffffcc",
    borderRadius: 14,
    marginTop: 12,
  },
  clusterRow: { flexDirection: "row", gap: 8 },
  presence: { alignItems: "center" },
  bubble: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 20,
    color: "#6b9bff",
    fontSize: 15,
    fontWeight: "600",
  },
  orb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -6,
  },
  orbSymbol: { color: "#fff", fontSize: 23 },
  bottom: {
    backgroundColor: "#fffffff0",
    padding: 18,
    borderRadius: 25,
    gap: 6,
    marginBottom: 12,
  },
  link: {
    color: "#078bff",
    paddingVertical: 14,
    textAlign: "center",
    fontSize: 16,
  },
  errorCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  shade: { flex: 1, backgroundColor: "#00000066", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "white",
    padding: 28,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    gap: 18,
  },
  heading: { fontSize: 24, fontWeight: "700", color: "#526372" },
  cloud: { fontSize: 90, color: "#078bff", textAlign: "center" },
});
