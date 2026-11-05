import { useImperativeHandle, type Ref } from "react";
import { requireNativeModule } from "expo-modules-core";

export type DatePickerHandle = { open: (date: Date) => void };
export type DatePickerProps = { ref: Ref<DatePickerHandle>; label: string; onChange: (value: string) => void };

const picker = requireNativeModule<{
  pickEventDate(title: string, milliseconds: number): Promise<number | null>;
}>("PresenceNative");

export function EventDatePicker({ ref, label, onChange }: DatePickerProps) {
  useImperativeHandle(ref, () => ({
    async open(date) {
      const value = await picker.pickEventDate(label + "日時", date.getTime());
      if (value != null) onChange(new Date(value).toISOString());
    },
  }), [label, onChange]);
  return null;
}
