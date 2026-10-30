import { StreetLogin } from "../../components/StreetLogin";
import { StreetEntrySheet } from "../../components/StreetEntrySheet";
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
      <StreetLogin
        email={email}
        setEmail={setEmail}
        code={code}
        setCode={setCode}
        sent={sent}
        setSent={setSent}
        error={error}
        setError={setError}
        busy={busy}
        login={login}
      />
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
      <StreetEntrySheet
        sheet={sheet}
        setSheet={setSheet}
        exit={exit}
        scan={scan}
      />
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
          <Pressable accessibilityRole="button" onPress={closeAccount}>
            <Text style={styles.link}>地図に戻る</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
