import { native, streetID } from "../lib/native";
import { SpeechBubble } from "../components/denshin/SpeechBubble";
import { PinSheet } from "../components/denshin/PinSheet";
import { SuperAsset } from "../components/icons/SuperAsset";
import { RoundAction } from "../components/denshin/PinParts";
import { scheduleEntrySuccessDismissal } from "../lib/entrySuccessDismissal";
import { requireNativeModule } from "expo-modules-core";
import type { NativeStackNavigationProp } from "expo-router";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useNavigation } from "expo-router";
import {
  Platform,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { EntryAnimation } from "../components/map/EntryAnimation";
import { entrySheetState } from "../lib/entrySheetState";
import { useEntryPresentation } from "../hooks/useEntryPresentation";
import { fieldTrial, localEntry, nfcDisabled } from "../lib/development";
export default function StreetEntry() {
  const trialRing =
    Platform.OS === "ios" && nfcDisabled && (fieldTrial || localEntry);
  const started = useRef(false);
  const value = useSyncExternalStore(
    entrySheetState.subscribe,
    entrySheetState.get,
  );
  const phase = useEntryPresentation(value?.sheet ?? null);
  const [count, setCount] = useState<number>();
  useEffect(() => {
    let live = true;
    void native
      .rpc<{ total: number }>("visit_count", { street_id: streetID })
      .then((result) => {
        if (live) setCount(result.total + (phase === "success" ? 0 : 1));
      })
      .catch(() => {
        if (live) setCount(undefined);
      });
    return () => {
      live = false;
    };
  }, [phase]);
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
    <PinSheet>
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? 0 : 24,
          paddingHorizontal: 20,
          paddingBottom: 12,
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: 44 }} />
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <SuperAsset name="s3logo" size={22} />
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: "ui-rounded",
                fontSize: 20,
              }}
            >
              Login city
            </Text>
          </View>
          <RoundAction
            label="閉じる"
            glyph="×"
            onPress={() => entrySheetState.close()}
          />
        </View>
        <View style={{ marginTop: 30 }}>
          <EntryAnimation phase={phase} size={diameter} />
          {count !== undefined && count > 0 && (
            <View
              pointerEvents="none"
              style={{ position: "absolute", right: 0, top: 20 }}
            >
              <SpeechBubble>
                <SuperAsset name="非常口rounded" size={23} />
                <Text
                  style={{
                    color: "#34C759",
                    fontFamily: "ui-rounded",
                    fontSize: 18,
                  }}
                >
                  {count}回目
                </Text>
              </SpeechBubble>
            </View>
          )}
          {phase === "explain" && (trialRing || !!value.entryError) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={trialRing ? "街に入る" : "読み取りを再試行"}
              onPress={() => void value.scan(trialRing ? "default" : "tag")}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: diameter / 2,
              }}
            />
          )}
        </View>
        <View style={{ alignItems: "center", gap: 12 }}>
          {!!value.placeName && (
            <Text
              style={{
                fontFamily: "ui-rounded",
                color: "white",
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 20,
                padding: 8,
              }}
            >
              {value.placeName}
            </Text>
          )}
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: "white",
              fontWeight: "600",
              fontSize: 17.92,
              textAlign: "center",
            }}
          >
            {phase === "success"
              ? "ログイン成功"
              : phase === "explain"
                ? "NFCステッカーで街にログイン"
                : phase === "scanning"
                  ? "ステッカーにタッチしてください"
                  : "ログインしています…"}
          </Text>
          {phase === "explain" && !!value.entryError && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: "#a62d35", textAlign: "center" }}
            >
              {value.entryError}
            </Text>
          )}
          {phase === "explain" && (
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                fontSize: 13.44,
              }}
            >
              名前や正確な現在地は地図には出ません
            </Text>
          )}
          {phase === "checking" && (
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                fontSize: 13.44,
              }}
            >
              {localEntry
                ? "開発用タグで接続中"
                : "読み取り後はステッカーから離して大丈夫です"}
            </Text>
          )}
        </View>
        <View style={{ marginTop: 30, marginBottom: 20 }}>
          {phase === "success" ? (
            <SuperAsset name="checkRounded" size={42} />
          ) : phase !== "explain" ? (
            <ActivityIndicator size="large" color="rgba(255,255,255,0.65)" />
          ) : null}
        </View>
      </ScrollView>
    </PinSheet>
  );
}
