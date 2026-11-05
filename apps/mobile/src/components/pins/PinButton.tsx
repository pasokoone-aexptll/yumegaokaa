import { IconPressable as Pressable } from "../icons/IconMotion";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { MapAsset } from "../map/MapAsset";
export function PinButton({
  title,
  onPress,
  disabled,
  loading,
  destructive,
  secondary,
  textOnly,
}: {
  title: string;
  onPress: () => void | Promise<unknown>;
  disabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
  secondary?: boolean;
  textOnly?: boolean;
}) {
  const color = destructive ? "#ff354b" : secondary ? "#008cff" : "white";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        void onPress();
      }}
      style={[
        styles.button,
        {
          backgroundColor: destructive
            ? "#ff354b29"
            : secondary
              ? "#0000000a"
              : "#008cff",
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        !secondary &&
        !textOnly && (
          <MapAsset name={destructive ? "trash" : "checkcreate"} size={24} />
        )
      )}
      <Text style={{ color, fontSize: 17, fontWeight: "600" }}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 30,
    borderCurve: "continuous",
    paddingHorizontal: 20,
    minHeight: 54,
  },
});
