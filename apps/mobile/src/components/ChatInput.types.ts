import type { TextInputProps } from "react-native";
export type ChatInputProps = TextInputProps & {
  onCompositionChange?: (composing: boolean) => void;
};
