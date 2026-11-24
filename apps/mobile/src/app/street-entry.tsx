import { PinSheetFooter } from "../components/denshin/PinSheetFooter";
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
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { EntryProgress } from "../components/map/EntryProgress";
import { EntryAnimation } from "../components/map/EntryAnimation";
import { entrySheetState } from "../lib/entrySheetState";
import { useEntryPresentation } from "../hooks/useEntryPresentation";
import { fieldTrial, localEntry, nfcDisabled } from "../lib/development";
export default function StreetEntry() {
  const trialRing =
    Platform.OS === "ios" &&
    (fieldTrial || (localEntry && (nfcDisabled || native.isSimulator?.())));
  const started = useRef(false);
  const lastError = useRef("");
  const value = useSyncExternalStore(
    entrySheetState.subscribe,
    entrySheetState.get,
  );
  const phase = useEntryPresentation(value?.sheet ?? null);
  useEffect(() => {
    const message = value?.entryError ?? "";
    if (message && message !== lastError.current) {
      Alert.alert("ログインできませんでした", message, [
        {
          text: "閉じる",
          style: "cancel",
          onPress: () => entrySheetState.close(),
        },
        {
          text: "もう一度読み取る",
          onPress: () =>
            void entrySheetState.get()?.scan(trialRing ? "default" : "tag"),
        },
      ]);
    }
    lastError.current = message;
  }, [value?.entryError, trialRing]);
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
  // Space for the centered 90pt sign and its visit-count bubble.
  const diameter = width * (0.82 / 0.975);
  useEffect(() => {
    if (
      (fieldTrial || !trialRing) &&
      value?.sheet === "explain" &&
      !started.current
    ) {
      started.current = true;
      void value.scan(fieldTrial ? "default" : "tag");
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
          paddingTop: 16,
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: Platform.OS === "android" ? 110 : 12,
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
          <View style={{ width: 49 }} />
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <SuperAsset name="s3logo" size={22} />
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: "ui-rounded",
                fontWeight: "600",
                fontSize: 17,
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
        <View style={{ marginTop: 22 }}>
          <EntryAnimation phase={phase} size={diameter} />
          {count !== undefined && count > 0 && (
            <View
              pointerEvents="none"
              style={{ position: "absolute", right: 32, top: 8 }}
            >
              <SpeechBubble>
                <SuperAsset name="非常口rounded" size={21} />
                <Text
                  style={{
                    color: "#34C759",
                    fontFamily: "ui-rounded",
                    fontSize: 17,
                  }}
                >
                  {count}回目
                </Text>
              </SpeechBubble>
            </View>
          )}
        </View>
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text
            style={{
              fontFamily: "ui-rounded",
              color: "white",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 14,
              fontSize: 16,
            }}
          >
            Tokyo
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: "white", fontSize: 17, textAlign: "center" }}
          >
            {phase === "success"
              ? "ログイン成功"
              : phase === "checking"
                ? "ログインしています…"
                : "NFCを探しています…"}
          </Text>
        </View>
        {Platform.OS === "ios" && <View style={{ flex: 1, minHeight: 26 }} />}
        <PinSheetFooter active>
          <Pressable
            accessibilityRole={trialRing ? "button" : "progressbar"}
            accessibilityLabel={
              trialRing && phase === "explain"
                ? "NFCログインを試す"
                : phase === "success"
                  ? "ログイン成功"
                  : "NFCを待機中"
            }
            disabled={!trialRing || phase !== "explain"}
            onPress={() => void value.scan("default")}
            hitSlop={12}
            style={
              Platform.OS === "android"
                ? { position: "absolute", bottom: 28, alignSelf: "center" }
                : { marginBottom: 12 }
            }
          >
            <EntryProgress success={phase === "success"} />
          </Pressable>
        </PinSheetFooter>
      </ScrollView>
    </PinSheet>
  );
}
