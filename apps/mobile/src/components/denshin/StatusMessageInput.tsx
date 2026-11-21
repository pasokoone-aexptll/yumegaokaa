import { Platform, StyleSheet, TextInput, View } from "react-native";

export function StatusMessageInput({
  value,
  onChangeText,
  editable = true,
}: {
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="ステータスメッセージ"
        placeholder="ステータスメッセージ"
        placeholderTextColor="#ffffff55"
        multiline
        maxLength={500}
        editable={editable}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 26,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  input: {
    padding: 0,
    fontFamily: "ui-rounded",
    fontSize: 18,
    lineHeight: Platform.OS === "ios" ? undefined : 26,
    includeFontPadding: false,
    color: "white",
    maxHeight: 164,
    textAlignVertical: "center",
  },
});
