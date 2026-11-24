import { forwardRef, type ComponentRef } from "react";
import { Text as NativeText, TextInput as NativeTextInput } from "react-native";
import type { TextProps, TextInputProps } from "react-native";

// Imported by the Android-only Babel transform. Nested Text still inherits size/weight.
export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(
  function Text(props, ref) {
    return (
      <NativeText
        {...props}
        ref={ref}
        style={[{ fontFamily: "DenshinAndroid" }, props.style]}
      />
    );
  },
);
export const TextInput = forwardRef<
  ComponentRef<typeof NativeTextInput>,
  TextInputProps
>(function TextInput(props, ref) {
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      style={[{ fontFamily: "DenshinAndroid" }, props.style]}
    />
  );
});
