import { TextInput } from "react-native";
import type { ChatInputProps } from "./ChatInput.types";
export function ChatInput({ onCompositionChange, ...props }: ChatInputProps) {
  void onCompositionChange;
  return <TextInput {...props} />;
}
