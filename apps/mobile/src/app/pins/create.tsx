import { canSaveDenshinBody } from "../../lib/denshinBody";
import { StatusMessageInput } from "../../components/denshin/StatusMessageInput";
import { NativeToggle as Switch } from "../../components/denshin/NativeToggle";
import { NativeAction } from "../../components/denshin/NativeAction";
import { useContext, useState } from "react";
import { ReducedIconMotion } from "../../components/icons/IconMotion";
import { RollingNumber } from "../../components/denshin/RollingNumber";
import { SuperAsset } from "../../components/icons/SuperAsset";
import {
  Alert,
  LayoutAnimation,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDenshinEditor } from "../../hooks/useDenshinEditor";
import { updateDenshinDraft } from "../../lib/denshinDraft";
import { beginDenshinPlacement } from "../../lib/pinPlacement";
import { PinSheet } from "../../components/denshin/PinSheet";
import {
  PinHeading,
  RoundAction,
  green,
} from "../../components/denshin/PinParts";
export default function CreatePin() {
  const router = useRouter(),
    insets = useSafeAreaInsets();
  const { draft, busy, locked, error, save, discard, remove } =
    useDenshinEditor();

  const disabled = busy || locked;
  const canSave =
    canSaveDenshinBody(draft.body, !!draft.id) && !!draft.location;
  const [expanded, setExpanded] = useState(false);
  const reduced = useContext(ReducedIconMotion);
  function close() {
    void discard();
  }
  function publish() {
    if (
      draft.original?.recruiting &&
      !draft.recruiting &&
      draft.original.count > 0 &&
      !locked
    )
      Alert.alert(
        "募集を終了しますか？",
        "参加予定・現地にいる人を解除し、終了を通知します。メッセージは残ります。",
        [
          { text: "戻る", style: "cancel" },
          { text: "終了して保存", onPress: () => void save(true) },
        ],
      );
    else void save();
  }
  return (
    <PinSheet>
      <Stack.Screen
        options={{
          sheetAllowedDetents: [draft.limited && expanded ? 0.77 : 0.47, 0.95],
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        <View style={s.header}>
          <PinHeading suffix={draft.id ? "PINを編集" : "PINを作成"} />
          <View style={s.actions}>
            <RoundAction
              label="閉じる"
              glyph="×"
              onPress={close}
              disabled={busy}
            />
            <RoundAction
              label="保存"
              glyph="✓"
              onPress={publish}
              disabled={busy || (!locked && !canSave)}
              active={canSave}
            />
          </View>
        </View>
        {!!error && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: "#ffffffb3", marginBottom: 12 }}
          >
            {error}
          </Text>
        )}
        <StatusMessageInput
          editable={!disabled}
          value={draft.body}
          onChangeText={(body) => updateDenshinDraft({ body })}
        />
        <View style={s.group}>
          <View style={s.row}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <SuperAsset name="user" size={21} tint="white" opacity={0.65} />
              <Text style={s.label}>最大募集人数</Text>
            </View>
            <Switch
              accessibilityLabel="最大募集人数を設定"
              disabled={disabled}
              value={draft.limited}
              onValueChange={(limited) => updateDenshinDraft({ limited })}
              trackColor={{ true: green }}
            />
          </View>
          {draft.limited && <View style={s.divider} />}
          {draft.limited && !expanded && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="人数を変更"
              style={[s.row, s.numberRow]}
              onPress={() => {
                if (!reduced)
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                setExpanded(true);
              }}
            >
              <Text style={s.label}>数値</Text>
              <View style={s.numberPill}>
                <Text style={s.numberValue}>{draft.capacity}</Text>
                <View style={s.stepperGlyph}>
                  <View style={{ transform: [{ rotate: "-90deg" }] }}>
                    <SuperAsset
                      name="chevron-base"
                      size={12}
                      tint="white"
                      opacity={0.65}
                    />
                  </View>
                  <View style={{ transform: [{ rotate: "90deg" }] }}>
                    <SuperAsset
                      name="chevron-base"
                      size={12}
                      tint="white"
                      opacity={0.65}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          )}
          {draft.limited && expanded && (
            <View style={s.counter}>
              <RoundAction
                label="人数を減らす"
                glyph="−"
                disabled={
                  disabled ||
                  draft.capacity <= Math.max(1, draft.original?.count ?? 0)
                }
                onPress={() =>
                  updateDenshinDraft({ capacity: draft.capacity - 1 })
                }
              />
              <RollingNumber value={draft.capacity} />
              <RoundAction
                label="人数を増やす"
                glyph="＋"
                disabled={disabled || draft.capacity >= 100}
                onPress={() =>
                  updateDenshinDraft({ capacity: draft.capacity + 1 })
                }
              />
            </View>
          )}
          <View style={s.divider} />
          <View style={s.row}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <SuperAsset
                name="非常口rounded"
                size={21}
                tint="white"
                opacity={0.65}
              />
              <Text style={s.label}>募集モード</Text>
            </View>
            <Switch
              accessibilityLabel="募集モード"
              disabled={disabled}
              value={draft.recruiting}
              onValueChange={(recruiting) => updateDenshinDraft({ recruiting })}
              trackColor={{ true: green }}
            />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={disabled || !!draft.original?.count}
          style={[
            s.group,
            s.mapRow,
            { opacity: draft.original?.count ? 0.45 : 1 },
          ]}
          onPress={() => {
            Keyboard.dismiss();
            beginDenshinPlacement(draft.location);
            router.dismissTo("/(tabs)");
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <SuperAsset name="map" size={21} tint="white" opacity={0.65} />
            <Text style={s.label}>
              {draft.location ? "マップを変更する" : "マップを挿入"}
            </Text>
          </View>
        </Pressable>
        {!!draft.original?.count && (
          <Text style={s.hint}>参加者がいる間は場所を変更できません。</Text>
        )}
        <Text style={s.hint}>作成から24時間で消えます。1日3個まで。</Text>
        {!!draft.id && (
          <NativeAction
            title="電信PINを削除"
            destructive
            onDark
            contentWidth={190}
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
                    onPress: () => void remove(),
                  },
                ],
              )
            }
          />
        )}
      </ScrollView>
    </PinSheet>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 0,
    flexShrink: 0,
    paddingTop: 0,
    paddingLeft: 8,
    marginRight: -4,
  },
  actions: { flexDirection: "row", gap: 10 },
  content: { padding: 20, paddingTop: 16, gap: 24 },
  group: {
    borderRadius: 26,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 52,
    gap: 12,
  },
  label: {
    fontFamily: "ui-rounded",
    color: "rgba(255,255,255,0.65)",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 49,
    marginRight: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  numberRow: { paddingLeft: 49 },
  numberPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 64,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  numberValue: {
    fontFamily: "ui-rounded",
    fontSize: 20,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  stepperGlyph: { height: 18, justifyContent: "center", gap: -4 },
  mapRow: {
    height: 56,
    borderRadius: 28,
    borderCurve: "circular",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  hint: { fontSize: 13, color: "#ffffff88", marginTop: 5 },
  counter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingVertical: 12,
  },
  number: {
    color: "white",
    fontSize: 40,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "center",
  },
  error: { color: "#ffd0d0", fontSize: 15 },
});
