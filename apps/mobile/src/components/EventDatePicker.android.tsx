import { useImperativeHandle } from "react";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import type { DatePickerProps } from "./EventDatePicker";

export function EventDatePicker({ ref, onChange }: DatePickerProps) {
  useImperativeHandle(ref, () => ({
    open(value) {
      DateTimePickerAndroid.open({
        mode: "date", value,
        onValueChange: (_, day) => {
          const selected = new Date(value);
          selected.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
          DateTimePickerAndroid.open({
            mode: "time", value: selected,
            onValueChange: (_, time) => {
              selected.setHours(time.getHours(), time.getMinutes(), 0, 0);
              onChange(selected.toISOString());
            },
          });
        },
      });
    },
  }), [onChange]);
  return null;
}
