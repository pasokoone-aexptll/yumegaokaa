import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDenshinEditor } from "../../hooks/useDenshinEditor";
import { updateDenshinDraft, clearDenshinDraft } from "../../lib/denshinDraft";
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
  const { draft, busy, locked, error, save, revise } = useDenshinEditor();
  const disabled = busy || locked;
  function close() {
    if (busy) return;
    if (locked) {
      void revise();
      return;
    }
    Alert.alert("編集を閉じますか？", "保存していない内容を破棄します。", [
      { text: "戻る", style: "cancel" },
      {
        text: "破棄",
        style: "destructive",
        onPress: () => {
          clearDenshinDraft();
          router.back();
        },
      },
    ]);
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
            disabled={busy}
            active={!!draft.body.trim() && !!draft.location}
          />
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        <TextInput
          accessibilityLabel="ステータスメッセージ"
          placeholder="ステータスメッセージ"
          placeholderTextColor="#ffffff55"
          multiline
          maxLength={500}
          editable={!disabled}
          value={draft.body}
          onChangeText={(body) => updateDenshinDraft({ body })}
          style={s.input}
        />
        <View style={s.group}>
          <View style={s.row}>
            <Text style={s.label}>最大募集人数</Text>
            <Switch
              accessibilityLabel="最大募集人数を設定"
              disabled={disabled}
              value={draft.limited}
              onValueChange={(limited) => updateDenshinDraft({ limited })}
              trackColor={{ true: green }}
            />
          </View>
          {draft.limited && (
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
              <Text
                accessibilityLabel={`上限${draft.capacity}人`}
                style={s.number}
              >
                {draft.capacity}
              </Text>
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
          <View style={s.row}>
            <Text style={s.label}>募集モード</Text>
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
            { padding: 20, opacity: draft.original?.count ? 0.45 : 1 },
          ]}
          onPress={() => {
            Keyboard.dismiss();
            beginDenshinPlacement(draft.location);
            router.dismissTo("/(tabs)");
          }}
        >
          <Text style={s.label}>
            ⌖ {draft.location ? "マップを変更する" : "マップを挿入"}
          </Text>
          {draft.location && <Text style={s.hint}>場所を選択済み</Text>}
        </Pressable>
        {!!draft.original?.count && (
          <Text style={s.hint}>参加者がいる間は場所を変更できません。</Text>
        )}
        <Text style={s.hint}>作成から24時間で消えます。1日3個まで。</Text>
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        {locked && (
          <Pressable disabled={busy} onPress={() => void revise()}>
            <Text style={s.label}>送信結果を確認して編集に戻る</Text>
          </Pressable>
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
    padding: 20,
    paddingTop: 24,
  },
  actions: { flexDirection: "row", gap: 10 },
  content: { padding: 22, gap: 24 },
  input: {
    borderRadius: 26,
    backgroundColor: "#ffffff22",
    padding: 20,
    fontSize: 21,
    color: "white",
    minHeight: 66,
    maxHeight: 190,
    textAlignVertical: "top",
  },
  group: { borderRadius: 28, backgroundColor: "#ffffff22", overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    gap: 12,
  },
  label: { color: "#ffffffdd", fontSize: 18 },
  hint: { fontSize: 13, color: "#ffffff88", marginTop: 5 },
  counter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ffffff33",
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
