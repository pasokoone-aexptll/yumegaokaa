import { GlassView } from "./PlatformGlass";
import { ModeDropdown } from "./ModeDropdown";
import { ParticipationSwitch } from "./ParticipationSwitch";
import { StyleSheet, View, Text } from "react-native";
import { DenshinLogo, SuperAsset } from "../icons/SuperAsset";

export function MapHeader({
  active,
  count,
  stale = false,
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
  stale?: boolean;
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
        style={{ minWidth: 0, alignItems: "flex-start" }}
      >
        <DenshinLogo dark />
      </View>
      {
        <GlassView
          glassEffectStyle="regular"
          colorScheme="dark"
          tintColor="#AF52DE"
          accessible
          accessibilityLabel={
            count === undefined
              ? "街の人数を取得中"
              : `街にログイン中 ${count}人${stale ? "、最終取得時" : ""}`
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 24,
            borderCurve: "continuous",
            overflow: "hidden",
          }}
        >
          <SuperAsset name="user-fill" tint="white" size={21} />
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontWeight: "700",
              color: "white",
              fontSize: 20,
            }}
          >
            {count ?? "—"}
          </Text>
        </GlassView>
      }
      <View style={{ flex: 1 }} />
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
    gap: 10,
    marginTop: 10,
    marginBottom: 0,
  },
});
