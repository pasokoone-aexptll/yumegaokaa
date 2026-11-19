import { useRef, type ComponentRef } from "react";
import { Pressable, TextInput, View } from "react-native";
import { RollingNumber } from "./RollingNumber";

/** One real autofill/paste field; the six visual slots never replace text input semantics. */
export function CodeInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => input.current?.focus()}
      style={{ position: "relative" }}
    >
      <View
        pointerEvents="none"
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            {value[index] !== undefined && (
              <RollingNumber value={Number(value[index])} compact light />
            )}
          </View>
        ))}
      </View>
      <TextInput
        ref={input}
        accessibilityLabel="6桁の認証コード"
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 6))}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          color: "transparent",
        }}
        caretHidden
      />
    </Pressable>
  );
}
