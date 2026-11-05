import { useState } from "react";
import { requireNativeViewManager } from "expo-modules-core";
import type { NativeSyntheticEvent, ViewProps } from "react-native";
import type { ChatInputProps } from "./ChatInput.types";
type Change = { text: string; eventCount: number; composing: boolean };
const Input = requireNativeViewManager<ViewProps & {
  textState: { text: string; eventCount: number };
  placeholder: string;
  editable: boolean;
  maxLength: number;
  inputLabel: string;
  onTextChange: (event: NativeSyntheticEvent<Change>) => void;
}>("PresenceNative", "ChatIMEInput");
export function ChatInput(props: ChatInputProps) {
  const [eventCount, setEventCount] = useState(0);
  return <Input
    style={[props.style, { minHeight: 44, paddingLeft: 0, paddingVertical: 0 }]}
    onTouchStart={props.onTouchStart}
    textState={{ text: props.value ?? "", eventCount }}
    placeholder={props.placeholder ?? ""}
    editable={props.editable !== false}
    maxLength={props.maxLength ?? 500}
    inputLabel={props.accessibilityLabel ?? ""}
    onTextChange={({ nativeEvent }) => {
      setEventCount(nativeEvent.eventCount);
      props.onChangeText?.(nativeEvent.text);
      props.onCompositionChange?.(nativeEvent.composing);
    }}
  />;
}
