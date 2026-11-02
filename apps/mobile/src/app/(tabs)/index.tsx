import { MapStatusBanner } from "../../components/map/MapStatusBanner";
import { MapErrorDialog } from "../../components/map/MapErrorDialog";
import { ProgressiveBlur } from "../../components/map/ProgressiveBlur";
import { BlurView } from "expo-blur";
import { MapHeader } from "../../components/map/MapHeader";
import { MapAsset } from "../../components/map/MapAsset";
import { StatusBar } from "expo-status-bar";
import { PresenceHeader } from "../../components/PresenceHeader";
import { StreetLogin } from "../../components/StreetLogin";
import { StreetEntrySheet } from "../../components/StreetEntrySheet";
import { StreetMapMarkers } from "../../components/StreetMapMarkers";
import { streetMapStyles as styles } from "../../components/streetMapStyles";
import { mapStyle } from "../../lib/mapStyle";
import { StreetChat } from "../../components/StreetChat";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraRef, Map } from "../../components/map/PlatformMap";
import { native, url } from "../../lib/native";
import { liveCells } from "../../lib/presence";
import { localEntry, nfcDisabled } from "../../lib/development";
import { useStreetMap } from "../../hooks/useStreetMap";
export default function Street() {
  const [chatRead, setChatRead] = useState<{
    error: string;
    reload: () => Promise<void>;
  } | null>(null);
  const camera = useRef<CameraRef>(null);
  const params = useLocalSearchParams<{
    longitude?: string;
    latitude?: string;
    panel?: string;
    mapRequest?: string;
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
      ready &&
      signed &&
      params.longitude &&
      params.latitude &&
      Number.isFinite(lon) &&
      Number.isFinite(lat)
    )
      camera.current?.flyTo({ center: [lon, lat], zoom: 16, duration: 600 });
  }, [params.longitude, params.latitude, params.mapRequest, ready, signed]);
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
  const presenceIcons = cells.flatMap((cell) =>
    cell.clusters.flatMap((cluster) => cluster.icons),
  );
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        onPress={Keyboard.dismiss}
      >
        <Camera
          ref={camera}
          initialViewState={{
            center: [139.7109, 35.7295],
            zoom: 17,
            pitch: 55,
          }}
        />
        <StreetMapMarkers
          cells={cells}
          events={events}
          recruitments={recruitments}
          now={now}
        />
      </Map>
      <SafeAreaView
        style={styles.overlay}
        pointerEvents="box-none"
        onTouchStart={Keyboard.dismiss}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 190,
          }}
        >
          <ProgressiveBlur edge="top" intensity={30} />
        </View>
        <MapHeader
          name={name}
          count={snapshot?.checked_in_count}
          stale={!!error}
          active={active}
          onToggle={(value) => (value ? setSheet("explain") : void exit())}
        />
        <View style={{ minHeight: 48 }}>
          <PresenceHeader icons={presenceIcons} />
        </View>
        {!!chatRead?.error && (
          <MapStatusBanner
            message={chatRead.error}
            actionLabel="再読み込み"
            onAction={chatRead.reload}
            autoDismiss={false}
          />
        )}
        {!["未参加", "気配を観測中"].includes(state.status) && (
          <MapStatusBanner key={state.status} message={state.status}>
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
          </MapStatusBanner>
        )}
        <View style={{ alignSelf: "flex-end", gap: 10, marginTop: 14 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ピンを追加"
            onPress={() => router.push("/pins/create")}
            style={{
              backgroundColor: "#00000033",
              overflow: "hidden",
              borderRadius: 23,
              width: 46,
              height: 46,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BlurView
              pointerEvents="none"
              intensity={25}
              tint="default"
              style={StyleSheet.absoluteFill}
            />
            <MapAsset name="CreatePIN" size={26} centered />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="現在地へ戻る"
            onPress={() => void recenter()}
            style={{
              backgroundColor: "#00000033",
              overflow: "hidden",
              borderRadius: 23,
              width: 46,
              height: 46,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BlurView
              pointerEvents="none"
              intensity={25}
              tint="default"
              style={StyleSheet.absoluteFill}
            />
            <MapAsset name="Navi" size={26} centered />
          </Pressable>
        </View>
      </SafeAreaView>
      <StreetChat onReadStatus={setChatRead} />
      {!!error && <MapErrorDialog key={error} message={error} />}
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
