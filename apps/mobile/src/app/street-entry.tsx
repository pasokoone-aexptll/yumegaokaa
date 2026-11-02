import { scheduleEntrySuccessDismissal } from "../lib/entrySuccessDismissal";
import { requireNativeModule } from "expo-modules-core";
import type { NativeStackNavigationProp } from "expo-router";
import { useEffect, useSyncExternalStore } from "react";
import { router, useNavigation } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { SvgXml } from "react-native-svg";
import { mapSvgAssets } from "../components/map/mapAssets";
import { EntryAnimation } from "../components/map/EntryAnimation";
import { entrySheetState } from "../lib/entrySheetState";
import { useEntryPresentation } from "../hooks/useEntryPresentation";
import { localEntry } from "../lib/development";
const header = mapSvgAssets["DreamCloud Logo"]
  .replaceAll('fill="white"', 'fill="black"')
  .replaceAll('fill="#FFFFFF"', 'fill="#000000"');
export default function StreetEntry() {
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
  useEffect(
    () =>
      navigation.addListener("transitionEnd", (event) => {
        if (event.data.closing) entrySheetState.close();
      }),
    [navigation],
  );
  useEffect(() => {
    if (!value?.sheet && router.canGoBack()) router.back();
  }, [value?.sheet]);
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
    <View style={{ flex: 1, backgroundColor: "#ffffff66" }}>
      <BlurView
        pointerEvents="none"
        intensity={45}
        tint="light"
        style={{ position: "absolute", inset: 0 }}
      />
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
          {phase === "explain" && (
            <Pressable
              accessibilityRole="button"
              onPress={value.scan}
              style={{
                position: "absolute",
                left: 0,
                top: 4,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: "#00ADF2", fontSize: 13.44 }}>
                {localEntry ? "開発用タグで入街（NFC代用）" : "NFCを読み取る"}
              </Text>
            </Pressable>
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
          {phase === "explain" && (
            <Text style={{ color: "#00000080", textAlign: "center", fontSize: 13.44 }}>
              名前や正確な現在地は地図には出ません
            </Text>
          )}
          {phase === "explain" && (
            <Text style={{ color: "#00000080", textAlign: "center", fontSize: 11 }}>
              参加中は背景でも気配を共有します。OFFで停止できます。
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
