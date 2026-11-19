import { ModeDropdown } from "./ModeDropdown";
import { ParticipationSwitch } from "./ParticipationSwitch";
import { StyleSheet, View, Text } from "react-native";
import { DenshinLogo, SuperAsset } from "../icons/SuperAsset";

export function MapHeader({
  active,
  count,
  onToggle,
  ghost = false,
  modeDisabled = false,
  onModeChange,
  placesVisible,
  onTogglePlaces,
}: {
  placesVisible?: boolean;
  onTogglePlaces?: () => void;
  active: boolean;
  count?: number;
  onToggle: (value: boolean) => void;
  ghost?: boolean;
  modeDisabled?: boolean;
  onModeChange?: (ghost: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View
        accessible
        accessibilityLabel="電信"
        style={{ flex: 1, minWidth: 0, alignItems: "flex-start" }}
      >
        <DenshinLogo dark />
      </View>
      {count !== undefined && (
        <View
          accessible
          accessibilityLabel={`街にログイン中 ${count}人`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: "#FF3B30",
            paddingHorizontal: 8,
            paddingVertical: 7,
            borderRadius: 24,
          }}
        >
          <SuperAsset name="user-fill" tint="white" size={21} />
          <Text
            style={{ fontFamily: "ui-rounded", color: "white", fontSize: 20 }}
          >
            {count}
          </Text>
        </View>
      )}
      <ModeDropdown
        placesVisible={placesVisible}
        onTogglePlaces={onTogglePlaces}
        ghost={ghost}
        active={active}
        disabled={modeDisabled}
        onChange={onModeChange}
      />
      <ParticipationSwitch value={active} onChange={onToggle} />
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    marginBottom: 10,
  },
});
