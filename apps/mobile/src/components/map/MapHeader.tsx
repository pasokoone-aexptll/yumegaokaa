import { ModeDropdown } from "./ModeDropdown";
import { ParticipationSwitch } from "./ParticipationSwitch";
import { StyleSheet, View } from "react-native";
import { MapAsset } from "./MapAsset";

export function MapHeader({
  active,
  onToggle,
  ghost = false,
  modeDisabled = false,
  onModeChange,
  placesVisible, onTogglePlaces,
}: {
  placesVisible?: boolean;
  onTogglePlaces?: () => void;
  active: boolean;
  onToggle: (value: boolean) => void;
  ghost?: boolean;
  modeDisabled?: boolean;
  onModeChange?: (ghost: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View accessible accessibilityLabel="DreamCloud" style={{ flex: 1, minWidth: 0, alignItems: "flex-start" }}>
        <MapAsset name="DreamCloud Logo" width={164} height={32} tint="white" fillOpacity={0.6} />
      </View>
      <ModeDropdown placesVisible={placesVisible} onTogglePlaces={onTogglePlaces} ghost={ghost} active={active} disabled={modeDisabled} onChange={onModeChange} />
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
