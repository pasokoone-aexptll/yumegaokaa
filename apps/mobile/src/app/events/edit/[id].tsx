import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Modal, Text, TextInput } from "react-native";
import { Action, Page, ui } from "../../../components/Page";
import { LocationPicker } from "../../../components/LocationPicker";
import { useEventEditor } from "../../../hooks/useEventEditor";
export default function Edit() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    e = useEventEditor(id),
    [selecting, setSelecting] = useState(false);
  return (
    <Page title="イベントを編集">
      {!!e.error && <Text style={ui.error}>{e.error}</Text>}
      {e.event && (
        <>
          <TextInput
            style={ui.input}
            value={e.title}
            onChangeText={e.setTitle}
            maxLength={50}
            placeholder="オフ会名"
            editable={!e.ongoing}
          />
          <TextInput
            style={ui.input}
            value={e.description}
            onChangeText={e.setDescription}
            maxLength={1000}
            multiline
            placeholder="説明"
            editable={!e.ongoing}
          />
          <Text>開始</Text>
          <TextInput
            style={ui.input}
            value={e.start}
            onChangeText={e.setStart}
            editable={!e.ongoing}
          />
          <Text>終了</Text>
          <TextInput style={ui.input} value={e.end} onChangeText={e.setEnd} />
          <Text>定員</Text>
          <TextInput
            style={ui.input}
            value={e.capacity}
            onChangeText={e.setCapacity}
            keyboardType="number-pad"
            editable={!e.ongoing}
          />
          <Action
            title="場所を変更"
            disabled={e.ongoing || e.busy}
            onPress={() => setSelecting(true)}
          />
          <Action
            title="保存"
            disabled={e.busy || !e.title.trim()}
            onPress={() => void e.save()}
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
