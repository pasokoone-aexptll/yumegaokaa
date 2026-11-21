import { useRef, type ComponentRef } from "react";
import { Pressable, TextInput, View } from "react-native";
import { RollingNumber } from "./RollingNumber";

/** One real autofill/paste field; the six visual slots never replace text input semantics. */
export function CodeInput({
  value,
  onChange,
  disabled = false,
  success = false,
  grouped = true,
  emptyZeros = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  success?: boolean;
  grouped?: boolean;
  emptyZeros?: boolean;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => input.current?.focus()}
      style={{ position: "relative", marginHorizontal: grouped ? 6 : 0 }}
    >
      <View
        pointerEvents="none"
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 7,
        }}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              marginLeft: grouped && index === 3 ? 15 : 0,
              height: 56,
              borderRadius: grouped ? 12 : 14,
              backgroundColor: "rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            {(emptyZeros || value[index] !== undefined) && (
              <RollingNumber
                value={Number(value[index] ?? 0)}
                compact
                light
                color={success ? "#01AE6B" : undefined}
              />
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
