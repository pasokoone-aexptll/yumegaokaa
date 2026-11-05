import { useImperativeHandle, useState, type Ref } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export type DatePickerHandle = { open: (date: Date) => void };
export type DatePickerProps = { ref: Ref<DatePickerHandle>; label: string; onChange: (value: string) => void };

export function EventDatePicker({ ref, label, onChange }: DatePickerProps) {
  const [draft, setDraft] = useState<Date | null>(null);
  useImperativeHandle(ref, () => ({ open: setDraft }), []);
  return (
    <Modal visible={!!draft} presentationStyle="pageSheet" animationType="slide"
      allowSwipeDismissal onRequestClose={() => setDraft(null)}>
      <View style={{ padding: 20, flexDirection: "row", justifyContent: "space-between" }}>
        <Pressable onPress={() => setDraft(null)}><Text>キャンセル</Text></Pressable>
        <Text>{label}日時</Text>
        <Pressable onPress={() => { if (draft) onChange(draft.toISOString()); setDraft(null); }}>
          <Text>決定</Text>
        </Pressable>
      </View>
      {draft && <DateTimePicker value={draft} mode="datetime" display="spinner"
        onValueChange={(_, date) => setDraft(date)} />}
    </Modal>
  );
}
