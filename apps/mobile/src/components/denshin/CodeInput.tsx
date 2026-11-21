import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ReducedIconMotion } from "../icons/IconMotion";
import { RollingNumber } from "./RollingNumber";

/** One real autofill/paste field; the six visual slots never replace text input semantics. */
export function CodeInput({
  value,
  onChange,
  disabled = false,
  success = false,
  grouped = true,
  emptyZeros = false,
  groupGap,
  successWave = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  success?: boolean;
  grouped?: boolean;
  emptyZeros?: boolean;
  groupGap?: number;
  successWave?: boolean;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [wave] = useState(() => new Animated.Value(0));
  useEffect(() => {
    wave.setValue(0);
    if (!success || !successWave) return;
    const animation = Animated.timing(wave, {
      toValue: 750,
      duration: reduced ? 0 : 750,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [success, successWave, reduced, wave]);
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
              marginLeft: index === 3 ? (groupGap ?? (grouped ? 15 : 0)) : 0,
              height: 56,
              borderRadius: grouped ? 12 : 14,
              backgroundColor: "rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            {(emptyZeros || value[index] !== undefined) && (
              <>
                <RollingNumber
                  value={Number(value[index] ?? 0)}
                  compact
                  light
                  color={success && !successWave ? "#01AE6B" : undefined}
                />
                {successWave && success && (
                  <Animated.View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        opacity: wave.interpolate({
                          inputRange: [index * 100, index * 100 + 150],
                          outputRange: [0, 1],
                          extrapolate: "clamp",
                        }),
                      },
                    ]}
                  >
                    <RollingNumber
                      value={Number(value[index] ?? 0)}
                      compact
                      light
                      color="#01AE6B"
                    />
                  </Animated.View>
                )}
              </>
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
