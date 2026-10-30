import { StreetMapMarkers } from "../../components/StreetMapMarkers";
import { streetMapStyles as styles } from "../../components/streetMapStyles";
import { mapStyle } from "../../lib/mapStyle";
import { StreetChat } from "../../components/StreetChat";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraRef, Map } from "@maplibre/maplibre-react-native";
import { native, url } from "../../lib/native";
import { liveCells } from "../../lib/presence";
import { localEntry, nfcDisabled } from "../../lib/development";
import { useStreetMap } from "../../hooks/useStreetMap";
export default function Street() {
  const camera = useRef<CameraRef>(null);
  const params = useLocalSearchParams<{
    longitude?: string;
    latitude?: string;
    panel?: string;
  }>();
  const {
    ready,
    signed,
    email,
    setEmail,
    code,
    setCode,
    sent,
    setSent,
    state,
    snapshot,
    now,
    name,
    error,
    setError,
    busy,
    sheet,
    setSheet,
    settings,
    setSettings,
    events,
    recruitments,
    login,
    exit,
    scan,
    writeTestTag,
    active,
    logout,
  } = useStreetMap();
  function closeAccount() {
    setSettings(false);
    if (params.panel === "account") router.setParams({ panel: "" });
  }
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
        <StreetMapMarkers
          cells={cells}
          events={events}
          recruitments={recruitments}
          now={now}
        />
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

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => setSettings(true)}
          style={{ alignSelf: "flex-end" }}
        >
          <Text style={styles.link}>アカウント・接続状態</Text>
        </Pressable>
      </SafeAreaView>
      <StreetChat />
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
      <Modal
        visible={settings || params.panel === "account"}
        animationType="slide"
        onRequestClose={closeAccount}
      >
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
            onPress={() => {
              closeAccount();
              void logout();
            }}
          >
            <Text style={styles.buttonText}>ログアウト</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={closeAccount}
          >
            <Text style={styles.link}>地図に戻る</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
