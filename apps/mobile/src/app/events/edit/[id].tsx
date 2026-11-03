import { EventDateField } from "../../../components/EventDateField";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Alert, Modal, Text, TextInput, View } from "react-native";
import {
  PrimaryAction as Action,
  DetailPage as Page,
  DetailRow,
  Section,
  detail as ui,
} from "../../../components/DetailUI";
import { LocationPicker } from "../../../components/LocationPicker";
import { useEventEditor } from "../../../hooks/useEventEditor";
export default function Edit() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    e = useEventEditor(id),
    [selecting, setSelecting] = useState(false);
  return (
    <Page title="イベントを編集">
      {!!e.error && <Text style={ui.error}>{e.error}</Text>}
      {e.latest && (
        <View style={[ui.group, { padding: 16, gap: 8 }]}>
          <Text>最新の内容</Text>
          <Text>{e.latest.title}</Text>
          <Text>{e.latest.description}</Text>
          <Text>
            {new Date(e.latest.starts_at).toLocaleString()}〜
            {new Date(e.latest.ends_at).toLocaleString()}
          </Text>
          <Text>定員 {e.latest.capacity}人</Text>
          <Action
            title="最新内容から編集し直す"
            onPress={() =>
              Alert.alert(
                "入力を最新内容に置き換えますか？",
                "現在の入力は破棄されます。",
                [
                  { text: "入力を残す", style: "cancel" },
                  { text: "置き換える", onPress: e.useLatest },
                ],
              )
            }
          />
        </View>
      )}
      {!e.event && <Action title="再取得" onPress={e.load} />}
      {e.event && (
        <>
          <Section title="イベントの内容">
            <TextInput
              accessibilityLabel="オフ会名"
              style={ui.input}
              value={e.title}
              onChangeText={e.setTitle}
              maxLength={50}
              placeholder="オフ会名"
              editable={!e.ongoing && !e.busy}
            />
            <TextInput
              style={ui.input}
              value={e.description}
              onChangeText={e.setDescription}
              maxLength={1000}
              multiline
              placeholder="説明"
              editable={!e.ongoing && !e.busy}
            />
          </Section>
          <Section title="日時">
            <EventDateField
              compact
              label="開始"
              value={e.start}
              onChange={e.setStart}
              disabled={e.ongoing || e.busy}
            />
            <EventDateField
              compact
              label="終了"
              value={e.end}
              onChange={e.setEnd}
              disabled={e.busy}
            />
          </Section>
          {e.ongoing && (
            <Text style={ui.secondary}>開催中は終了時刻のみ変更できます。</Text>
          )}
          <Section title="定員">
            <TextInput
              style={ui.input}
              accessibilityLabel="定員"
              value={e.capacity}
              onChangeText={e.setCapacity}
              keyboardType="number-pad"
              editable={!e.ongoing && !e.busy}
            />
          </Section>
          <Section>
            <DetailRow
              icon="location-outline"
              title="開催場所を変更"
              disabled={e.ongoing || e.busy}
              onPress={() => setSelecting(true)}
            />
          </Section>
          <Action
            title="変更を保存"
            disabled={e.busy || !!e.latest || !e.title.trim()}
            onPress={e.save}
          />
        </>
      )}
      <Modal
        visible={selecting}
        animationType="slide"
        onRequestClose={() => setSelecting(false)}
      >
        <LocationPicker
          initial={e.point}
          onCancel={() => setSelecting(false)}
          onConfirm={(p) => {
            e.setPoint(p);
            setSelecting(false);
          }}
        />
      </Modal>
    </Page>
  );
}
