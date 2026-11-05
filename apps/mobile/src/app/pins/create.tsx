import { beginPinPlacement } from "../../lib/pinPlacement";
import { EventDateField } from "../../components/EventDateField";
import { updateDraft } from "../../lib/pinDraft";
import { usePinCreation } from "../../hooks/usePinCreation";
import { useProfile } from "../../hooks/useProfile";
import {
  Animated,
  Keyboard,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useRouter,
  useNavigation,
  type NativeStackNavigationProp,
} from "expo-router";
import { useLayoutEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinButton } from "../../components/pins/PinButton";
export default function CreatePin() {
  const router = useRouter();
  const {
    draft,
    busy,
    error,
    recruitBody,
    publish,
    revise,
    locate,
    discard,
    locked,
    restoring,
  } = usePinCreation();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<Record<string, object | undefined>>
    >();
  const { width } = useWindowDimensions();
  const [slide] = useState(
    () => new Animated.Value(draft.kind === "event" ? -width : 0),
  );
  const [bar] = useState(
    () => new Animated.Value(draft.kind === "event" ? 1 : 0),
  );
  const [switching, setSwitching] = useState(false);
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  const { kind, title, description, starts, ends, location, capacity } = draft;
  const disabled = busy || locked || switching;
  useLayoutEffect(() => {
    navigation.setOptions({
      sheetAllowedDetents: [kind === "event" ? 0.75 : 0.57],
      sheetLargestUndimmedDetentIndex: "none",
    });
  }, [kind, navigation]);

  function switchKind(value: "event" | "recruitment") {
    if (disabled || value === kind) return;
    Keyboard.dismiss();
    setSwitching(true);
    updateDraft({ kind: value });
    Animated.parallel([
      Animated.timing(bar, {
        toValue: value === "event" ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: value === "event" ? -width : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setSwitching(false));
  }
  function confirmDiscard() {
    Alert.alert(
      "下書きを破棄しますか？",
      "送信済みの場合は作成結果を確認します。",
      [
        { text: "戻る", style: "cancel" },
        {
          text: "破棄",
          style: "destructive",
          onPress: () => {
            void discard();
          },
        },
      ],
    );
  }
  function renderForm(kind: "event" | "recruitment") {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={s.content}
      >
        {restoring ? (
          <ActivityIndicator />
        ) : (
          <View style={s.form}>
            <View style={s.preview}>
              <View style={s.bubble}>
                <Text numberOfLines={1} style={s.name}>
                  {profile?.display_name ?? "…"}
                </Text>
              </View>
              <View style={s.tail} />
            </View>
            <View style={s.fields}>
              <TextInput
                accessibilityLabel="ピンの題名"
                editable={!disabled}
                style={s.input}
                placeholderTextColor="#00000033"
                placeholder={
                  kind === "event" ? "オフ会名を入力" : "募集ピン名を入力"
                }
                maxLength={50}
                value={title}
                onChangeText={(title) => updateDraft({ title })}
              />
              {kind === "event" ? (
                <>
                  <View
                    style={{
                      backgroundColor: "#00000008",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <EventDateField
                      compact
                      label="開始"
                      value={starts}
                      disabled={disabled}
                      onChange={(starts) => updateDraft({ starts })}
                    />
                    <EventDateField
                      compact
                      label="終了"
                      value={ends}
                      disabled={disabled}
                      suggested={
                        Number.isFinite(Date.parse(starts))
                          ? new Date(Date.parse(starts) + 3600000).toISOString()
                          : undefined
                      }
                      onChange={(ends) => updateDraft({ ends })}
                    />
                  </View>
                  <TextInput
                    accessibilityLabel="説明"
                    editable={!disabled}
                    style={[s.input, s.description]}
                    multiline
                    value={description}
                    onChangeText={(description) => updateDraft({ description })}
                    placeholder="説明を追加"
                    placeholderTextColor="#00000033"
                    maxLength={1000}
                  />
                  <View style={s.capacity}>
                    <Text style={s.hint}>定員</Text>
                    <TextInput
                      accessibilityLabel="定員（1〜100人）"
                      editable={!disabled}
                      style={[s.input, { flex: 1 }]}
                      keyboardType="number-pad"
                      value={capacity}
                      onChangeText={(capacity) => updateDraft({ capacity })}
                    />
                    <Text style={s.hint}>人</Text>
                  </View>
                  <Text style={s.hint}>
                    {location
                      ? `開催場所 ${location[1].toFixed(5)}, ${location[0].toFixed(5)}`
                      : "開催場所を選択してください"}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.hint}>今のあなたの位置情報</Text>
                  <Text style={s.hint}>
                    現在地を公開します。募集は20分または退出で終了します。
                  </Text>
                  <Pressable
                    disabled={busy}
                    onPress={() => {
                      void locate();
                    }}
                  >
                    <Text style={s.link}>
                      {busy
                        ? "現在地を確認中…"
                        : recruitBody
                          ? "現在地を再確認"
                          : "公開する現在地を確認"}
                    </Text>
                  </Pressable>
                  {recruitBody && (
                    <Text style={s.hint}>
                      {Number(recruitBody.latitude).toFixed(5)},{" "}
                      {Number(recruitBody.longitude).toFixed(5)}
                    </Text>
                  )}
                </>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
              {locked && (
                <Pressable
                  disabled={busy}
                  onPress={() => {
                    void revise();
                  }}
                >
                  <Text style={s.link}>前回の送信を確認して入力し直す</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    );
  }
  return (
    <KeyboardAvoidingView
      collapsable={false}
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View collapsable={false} style={s.header}>
        <Text style={s.heading}>ピンを追加します</Text>
      </View>
      <View collapsable={false} style={s.tabs}>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 20,
            width: (width - 40) / 2,
            height: 2,
            backgroundColor: "#008cff",
            transform: [
              {
                translateX: bar.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (width - 40) / 2],
                }),
              },
            ],
          }}
        />
        {(
          [
            ["recruitment", "募集ピンを作る"],
            ["event", "オフ会通知"],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: kind === value, disabled }}
            disabled={disabled}
            onPress={() => switchKind(value)}
            style={s.tab}
          >
            <Text style={[s.tabText, kind === value && { color: "#008cff" }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View
        collapsable={false}
        style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        <Animated.View
          style={{
            flex: 1,
            width: width * 2,
            flexDirection: "row",
            transform: [{ translateX: slide }],
          }}
        >
          <View style={{ width }}>{renderForm("recruitment")}</View>
          <View style={{ width }}>{renderForm("event")}</View>
        </Animated.View>
      </View>
      <View style={[s.footer, { paddingBottom: Math.max(12, insets.bottom) }]}>
        {kind === "event" && (
          <PinButton
            secondary
            title="場所を選択"
            disabled={disabled}
            onPress={() => {
              beginPinPlacement(location);
              router.dismissTo("/(tabs)");
              Keyboard.dismiss();
            }}
          />
        )}
        <View style={s.actions}>
          <View style={{ flex: 1 }}>
            <PinButton
              title="作成"
              loading={busy}
              disabled={busy || !title.trim()}
              onPress={publish}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PinButton
              title="破棄"
              destructive
              disabled={busy}
              onPress={confirmDiscard}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "white" },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { fontSize: 20, fontWeight: "600", color: "#00000099" },
  trash: {
    position: "absolute",
    right: 18,
    top: 19,
    backgroundColor: "#ff354b29",
    borderRadius: 20,
    padding: 8,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#0000000a",
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  selected: { borderColor: "#008cff" },
  tabText: { fontSize: 18, fontWeight: "600", color: "#00000033" },
  content: {
    flexGrow: 1,
    padding: 18,
    paddingBottom: 28,
    gap: 14,
    paddingTop: 26,
  },
  form: { flexDirection: "row", gap: 16 },
  preview: {
    width: 78,
    height: 80,
    backgroundColor: "#00000008",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    backgroundColor: "white",
    padding: 7,
    borderRadius: 24,
    borderCurve: "continuous",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    maxWidth: 76,
  },
  tail: {
    width: 10,
    height: 10,
    backgroundColor: "white",
    transform: [{ rotate: "45deg" }],
    marginTop: -5,
  },
  name: { color: "#609aff", fontSize: 14 },
  fields: { flex: 1, gap: 7 },
  input: {
    backgroundColor: "#00000008",
    borderRadius: 10,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#000000aa",
    fontSize: 18,
  },
  description: { minHeight: 48, textAlignVertical: "top" },
  capacity: { flexDirection: "row", gap: 8, alignItems: "center" },
  hint: { color: "#00000066", fontSize: 14 },
  link: { color: "#008cff", fontSize: 14, paddingVertical: 6 },
  error: { color: "#cf3044", fontSize: 14 },
  footer: { paddingHorizontal: 24, paddingTop: 8, gap: 10 },
  actions: { flexDirection: "row", gap: 10 },
});
