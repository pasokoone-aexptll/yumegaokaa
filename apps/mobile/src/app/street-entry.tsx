import { SheetChrome } from "../components/SheetChrome";
import { scheduleEntrySuccessDismissal } from "../lib/entrySuccessDismissal";
import { requireNativeModule } from "expo-modules-core";
import type { NativeStackNavigationProp } from "expo-router";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useNavigation } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { MapBlurView } from "../components/map/MapBlurView";
import { SvgXml } from "react-native-svg";
import { brandAndTabSvgAssets } from "../components/map/brandAndTabAssets";
import { EntryAnimation } from "../components/map/EntryAnimation";
import { entrySheetState } from "../lib/entrySheetState";
import { useEntryPresentation } from "../hooks/useEntryPresentation";
import { fieldTrial, localEntry, nfcDisabled } from "../lib/development";
const header = brandAndTabSvgAssets["DreamCloud Logo"]
  .replaceAll('fill="white"', 'fill="black"')
  .replaceAll('fill="#FFFFFF"', 'fill="#000000"');
export default function StreetEntry() {
  const trialRing = Platform.OS === "ios" && nfcDisabled && (fieldTrial || localEntry);
  const started = useRef(false);
  const value = useSyncExternalStore(
    entrySheetState.subscribe,
    entrySheetState.get,
  );
  const phase = useEntryPresentation(value?.sheet ?? null);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<Record<string, object | undefined>>
    >();
  const { width } = useWindowDimensions();
  // Figma: circle background spans 82% of screen width (SVG has 2.5% inset).
  const diameter = width * (0.82 / 0.975);
  useEffect(() => {
    if (!trialRing && value?.sheet === "explain" && !started.current) {
      started.current = true;
      void value.scan("tag");
    }
  }, [trialRing, value]);
  useEffect(() => {
    // Android's Material sheet can be removed without delivering transitionEnd
    // to the route being dismissed. Release the entry state on native removal.
    if (Platform.OS !== "android") return;
    return () => entrySheetState.close();
  }, []);
  useEffect(
    () =>
      navigation.addListener("transitionEnd", (event) => {
        if (event.data.closing) entrySheetState.close();
      }),
    [navigation],
  );
  useEffect(() => {
    if (!value?.sheet && navigation.canGoBack()) navigation.goBack();
  }, [value?.sheet, navigation]);
  useEffect(() => {
    if (phase !== "success") return;
    const bridge = requireNativeModule("PresenceNative");
    void bridge.entrySuccessHaptic?.();
    return scheduleEntrySuccessDismissal(
      () => entrySheetState.get()?.sheet === "success",
      () => entrySheetState.close(),
    );
  }, [phase]);
  if (!value || !phase) return null;
  return (
    <View style={{ flex: 1, backgroundColor: Platform.OS === "android" ? "#e0e4ed" : "#ffffff66" }}>
      {Platform.OS === "ios" && <MapBlurView
        pointerEvents="none"
        intensity={45}
        tint="light"
        style={{ position: "absolute", inset: 0 }}
      />}
      <SheetChrome />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 24,
          paddingHorizontal: 20,
          paddingBottom: 12,
          alignItems: "center",
          gap: 12,
        }}
      >
        <SvgXml xml={header} width={147} height={22} />
        <View style={{ marginTop: 8 }}>
          <EntryAnimation phase={phase} size={diameter} />
          {phase === "explain" && (trialRing || !!value.entryError) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={trialRing ? "街に入る" : "読み取りを再試行"}
              onPress={() => void value.scan(trialRing ? "default" : "tag")}
              style={{ position: "absolute", inset: 0, borderRadius: diameter / 2 }}
            />
          )}
        </View>
        <View style={{ alignItems: "center", gap: 2 }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: "#000000aa",
              fontWeight: "600",
              fontSize: 17.92,
              textAlign: "center",
            }}
          >
            {phase === "success"
              ? "街への参加が完了しました"
              : phase === "explain"
                ? "NFCステッカーで街にログイン"
                : phase === "scanning"
                  ? "ステッカーにタッチしてください"
                  : "街への参加を記録しています"}
          </Text>
          {phase === "explain" && !!value.entryError && <Text accessibilityLiveRegion="polite" style={{ color: "#a62d35", textAlign: "center" }}>{value.entryError}</Text>}
          {phase === "explain" && (
            <Text style={{ color: "#00000080", textAlign: "center", fontSize: 13.44 }}>
              名前や正確な現在地は地図には出ません
            </Text>
          )}
          {phase === "checking" && (
            <Text style={{ color: "#00000080", textAlign: "center", fontSize: 13.44 }}>
              {localEntry
                ? "開発用タグで接続中"
                : "読み取り後はステッカーから離して大丈夫です"}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
