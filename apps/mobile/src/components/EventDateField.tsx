import { IconPressable as Pressable } from "./icons/IconMotion";
import { MapAsset } from "./map/MapAsset";
import { useCallback, useRef } from "react";
import { EventDatePicker, type DatePickerHandle } from "./EventDatePicker";
import {
  Keyboard,
  StyleSheet,
  Text,
} from "react-native";


type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  suggested?: string;
  compact?: boolean;
};

export function EventDateField({
  label,
  value,
  onChange,
  disabled,
  suggested,
  compact = false,
}: Props) {
  const picker = useRef<DatePickerHandle>(null);
  const parsed = new Date(value);
  const valid = Number.isFinite(parsed.getTime());
  const handleOpen = useCallback(() => {
    Keyboard.dismiss();
    const selected = new Date(value);
    const fallback = new Date(suggested || Date.now() + 3600000);
    const next = Number.isFinite(selected.getTime())
      ? selected
      : Number.isFinite(fallback.getTime())
        ? fallback
        : new Date(Date.now() + 3600000);
    next.setSeconds(0, 0);
    picker.current?.open(next);
  }, [value, suggested]);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}日時を選択`}
        accessibilityValue={{
          text: valid ? parsed.toLocaleString() : "未設定",
        }}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handleOpen}
        style={[
          styles.row,
          compact && styles.compact,
          disabled && styles.disabled,
        ]}
      >
        {compact && (
          <MapAsset name={label === "開始" ? "clock" : "close"} size={13} />
        )}
        <Text
          style={[
            styles.label,
            compact && { color: "#00000055", fontSize: 14, fontWeight: "400" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.value,
            compact && { color: "#00000066", fontSize: 14, fontWeight: "400" },
          ]}
        >
          {valid
            ? parsed.toLocaleString(undefined, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "日時を選択"}
        </Text>
      </Pressable>
      <EventDatePicker ref={picker} label={label} onChange={onChange} />
    </>
  );
}
const styles = StyleSheet.create({
  row: {
    backgroundColor: "#f0f4f7",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  compact: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
    gap: 5,
    justifyContent: "flex-start",
  },
  disabled: { opacity: 0.45 },
  label: { color: "#34434b", fontWeight: "600", fontSize: 16 },
  value: { color: "#008cff", fontSize: 16, flexShrink: 1 },
});
