import { useContext } from "react";
import { SplashPlayingContext } from "../../components/LaunchSplash";
import { initialPitch } from "../../components/map/headerLayout";
import { IconPressable as Pressable } from "../../components/icons/IconMotion";
import { PlacementFooter } from "../../components/pins/PlacementFooter";
import {
  usePinPlacement,
  placePin,
  finishPinPlacement,
} from "../../lib/pinPlacement";

import { MapStatusBanner } from "../../components/map/MapStatusBanner";
import { MapErrorDialog } from "../../components/map/MapErrorDialog";
import { ProgressiveBlur } from "../../components/map/ProgressiveBlur";
import { useEntryPlacesPreference } from "../../hooks/useEntryPlacesPreference";
import { EntryPlaces } from "../../components/map/EntryPlaces";
import { MapHeader } from "../../components/map/MapHeader";
import { NativeIconButton } from "../../components/denshin/NativeIconButton";
import { StatusBar } from "expo-status-bar";
import { PresenceHeader } from "../../components/PresenceHeader";
import { StreetLogin } from "../../components/StreetLogin";
import { StreetEntrySheet } from "../../components/StreetEntrySheet";
import { StreetMapMarkers } from "../../components/StreetMapMarkers";
import { streetMapStyles as styles } from "../../components/streetMapStyles";
import { mapStyle } from "../../lib/mapStyle";
import { StreetChat } from "../../components/StreetChat";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useWindowDimensions,
  Platform,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraRef, Map } from "../../components/map/PlatformMap";
import { native } from "../../lib/native";
import { liveCells } from "../../lib/presence";
import { fieldTrial, localEntry } from "../../lib/development";
import { useStreetMap } from "../../hooks/useStreetMap";
export default function Street() {
  const router = useRouter();
  const placement = usePinPlacement();
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [mapMoving, setMapMoving] = useState(false);
  const { height } = useWindowDimensions();
  // Move the pin down 24pt so the title and countdown share the visible center.
  const detailSheetHeight = Math.max(
    0,
    height * (Platform.OS === "android" ? 0.5 : 0.38) - 48,
  );
  const [mapFocused, setMapFocused] = useState(false);
  const [androidMapReady, setAndroidMapReady] = useState(false);
  const [detailInset, setDetailInset] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setMapFocused(true);
      setDetailInset(0);
      return () => setMapFocused(false);
    }, []),
  );
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
    detailKind?: string;
    detailId?: string;
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
    entryMap,
    now,
    error,
    setError,
    busy,
    entryError,
    sheet,
    setSheet,
    events,
    denshinPins,
    recruitments,
    login,
    nextSendAt,
    exit,
    scan,
    active,
    changeMode,
  } = useStreetMap();
  const { visible: showPlaces, toggle: togglePlaces } =
    useEntryPlacesPreference();
  const ghost = state.visit.ghost ?? state.ghost_preference ?? false;
  const mode = state.pending_mode || (ghost ? "ghostActive" : "publicActive");
  const currentMode = signed && ready ? mode : undefined;
  const [previousMode, setPreviousMode] = useState(currentMode);
  const [modeNotice, setModeNotice] = useState("");
  if (previousMode !== currentMode) {
    setPreviousMode(currentMode);
    setModeNotice(
      !currentMode || (!previousMode && !state.pending_mode)
        ? ""
        : mode === "public"
          ? "公開への切替待ち・新しい位置を確認中"
          : mode === "ghost"
            ? "非公開への切替待ち"
            : ghost
              ? "ゴーストモードに切り替えました"
              : "通常モードに切り替えました",
    );
  }
  const openedRequest = useRef<string | undefined>(undefined);
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
    ) {
      const showDetail =
        !!params.detailId &&
        ["event", "recruitment", "denshin"].includes(params.detailKind ?? "");
      if (Platform.OS === "android" && (!mapFocused || !androidMapReady))
        return;
      if (params.mapRequest && openedRequest.current === params.mapRequest)
        return;
      let cancelled = false;
      const frame = requestAnimationFrame(async () => {
        const target = camera.current;
        if (!target || cancelled) return;
        setDetailInset(showDetail ? detailSheetHeight : 0);
        try {
          await target.flyTo({
            center: [lon, lat],
            zoom: 17,
            duration: 600,
            detailPadding: showDetail ? detailSheetHeight : 0,
          });
        } catch {
          if (!cancelled)
            setError(
              "開催場所を表示できませんでした。もう一度「地図で見る」を押してください。",
            );
          return;
        }
        if (cancelled) return;
        openedRequest.current = params.mapRequest;
        if (showDetail)
          router.push({
            pathname:
              params.detailKind === "denshin"
                ? "/map-pin"
                : params.detailKind === "event"
                  ? "/map-event"
                  : "/map-recruitment",
            params: { id: params.detailId!, fromMap: "1" },
          });
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }
  }, [
    mapFocused,
    androidMapReady,
    params.longitude,
    params.latitude,
    params.mapRequest,
    params.detailId,
    params.detailKind,
    detailSheetHeight,
    ready,
    signed,
  ]);
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
  const splashPlaying = useContext(SplashPlayingContext);
  if (splashPlaying) return <View style={styles.root} />;
  if (!ready)
    return (
      <View
        style={[
          styles.center,
          Platform.OS === "android" && { backgroundColor: "#303947" },
        ]}
      >
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
        nextSendAt={nextSendAt}
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
        onMapReady={() => setAndroidMapReady(true)}
        historyBlur={historyExpanded}
        bottomInset={detailInset}
        onMovingChange={setMapMoving}
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        placement={
          placement.active && placement.point
            ? {
                point: placement.point,
                revision: placement.revision,
                onDrop: placePin,
              }
            : undefined
        }
        onPress={(event) => {
          Keyboard.dismiss();
          if (placement.active) placePin(event.nativeEvent.lngLat);
        }}
      >
        <Camera
          ref={camera}
          initialViewState={{
            center: [139.7109, 35.7295],
            zoom: 17,
            pitch: initialPitch,
          }}
        />
        {entryMap && (!active || showPlaces) && !placement.active && (
          <EntryPlaces map={entryMap} />
        )}
        <StreetMapMarkers
          onSelect={(longitude, latitude) => {
            setDetailInset(detailSheetHeight);
            camera.current?.flyTo({
              center: [longitude, latitude],
              detailPadding: detailSheetHeight,
              zoom: 17,
              duration: 600,
            });
          }}
          cells={cells}
          pins={denshinPins}
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
          count={snapshot?.checked_in_count}
          stale={!!error}
          active={active}
          placesVisible={showPlaces}
          onTogglePlaces={togglePlaces}
          ghost={state.pending_mode ? state.pending_mode === "ghost" : ghost}
          modeDisabled={busy || state.pending_exit}
          onModeChange={changeMode}
          onToggle={(value) => (value ? setSheet("explain") : void exit())}
        />
        <View style={{ minHeight: 48 }}>
          <PresenceHeader icons={presenceIcons} />
        </View>
        <View pointerEvents="box-none" style={{ height: 48 }}>
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 2,
            }}
          >
            <MapStatusBanner message={modeNotice} />
            {chatRead && (
              <MapStatusBanner
                message={chatRead.error}
                actionLabel="再読み込み"
                onAction={chatRead.reload}
                autoDismiss={false}
              />
            )}
            {
              <MapStatusBanner
                message={
                  ["未参加", "気配を観測中"].includes(state.status) ||
                  /^(ゴーストモード|公開への切替待ち|非公開への切替待ち)/.test(
                    state.status,
                  )
                    ? ""
                    : state.status
                }
              >
                {state.visit.can_update === false &&
                  state.visit.state === "active" && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSheet("explain")}
                    >
                      <Text style={styles.link}>
                        {fieldTrial
                          ? "現地試験で入街"
                          : localEntry
                            ? "開発用の入街を開始"
                            : "この端末でNFCを読む"}
                      </Text>
                    </Pressable>
                  )}
              </MapStatusBanner>
            }
          </View>
        </View>
        <View style={{ alignSelf: "flex-end", gap: 10, marginTop: 14 }}>
          <NativeIconButton
            icon="add"
            label="ピンを追加"
            onPress={() => router.push("/pins/create")}
          />
          <NativeIconButton
            icon="nav"
            label="現在地へ戻る"
            onPress={() => void recenter()}
          />
        </View>
      </SafeAreaView>
      {!placement.active && (
        <StreetChat
          onHistoryChange={
            Platform.OS === "android" ? setHistoryExpanded : undefined
          }
          mapMoving={mapMoving}
          onReadStatus={setChatRead}
        />
      )}
      {placement.active && (
        <PlacementFooter
          disabled={!placement.point}
          onDone={() => {
            const destination = finishPinPlacement();
            if (destination?.kind === "edit")
              router.push({
                pathname: "/events/edit/[id]",
                params: { id: destination.id },
              });
            else if (destination) router.push("/pins/create");
          }}
        />
      )}
      {!!error && <MapErrorDialog key={error} message={error} />}
      <StreetEntrySheet
        placeName={entryMap?.name}
        entryError={entryError}
        sheet={sheet}
        setSheet={setSheet}
        exit={exit}
        scan={scan}
      />
    </View>
  );
}
