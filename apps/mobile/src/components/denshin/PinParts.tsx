import { EventCloudPin } from "../EventCloudPin";
import Svg, { Circle, Path } from "react-native-svg";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Avatar } from "../Avatar";
import type { PinPerson } from "../../lib/denshin";
export const green = "#2bc655";
export function RecruitmentGlyph({ color = green }: { color?: string }) {
  return (
    <Svg width={19} height={22} viewBox="0 0 20 24">
      <Path d="M2 2h12v20H2z" fill="none" stroke={color} strokeWidth={2} />
      <Circle cx={10} cy={6} r={2} fill={color} />
      <Path
        d="m9 9-3 4-3-1m6-3 3 4 5 1m-8-5-1 7-3 5m3-5 5 5"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function RecruitBadge() {
  return (
    <View style={s.badge}>
      <RecruitmentGlyph />
      <Text style={s.badgeText}>募集中</Text>
    </View>
  );
}
export function PinHeading({ suffix = "PIN" }: { suffix?: string }) {
  return (
    <Text style={s.heading}>
      電信 <Text style={s.suffix}>{suffix}</Text>
    </Text>
  );
}
export function RoundAction({
  label,
  glyph,
  onPress,
  disabled = false,
  active = false,
}: {
  label: string;
  glyph: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.round,
        active && { backgroundColor: green },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Text style={s.glyph}>{glyph}</Text>
    </Pressable>
  );
}
export function PeopleStack({ people }: { people: PinPerson[] }) {
  return (
    <View style={s.people}>
      {people.slice(0, 3).map((p) => (
        <View key={p.account_id} style={s.overlap}>
          <Avatar path={p.avatar_path} name={p.display_name} size={30} />
        </View>
      ))}
      {people.length > 3 && (
        <View style={[s.overlap, s.more]}>
          <Text style={{ color: "white" }}>+{people.length - 3}</Text>
        </View>
      )}
    </View>
  );
}
// Reuse the supplied Figma recruitment sign and its existing platform shadows.
export function RecruitmentSign() {
  return <EventCloudPin />;
}
const s = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "white",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  badgeText: { color: green, fontWeight: "600", fontSize: 15 },
  heading: { color: "#ffffffdd", fontWeight: "600", fontSize: 27 },
  suffix: { fontWeight: "400", fontSize: 17 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff26",
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { color: "white", fontSize: 26 },
  people: { flexDirection: "row", paddingLeft: 8, alignItems: "center" },
  overlap: {
    marginLeft: -8,
    borderWidth: 1.5,
    borderColor: "white",
    borderRadius: 18,
  },
  more: {
    width: 32,
    height: 32,
    backgroundColor: "#a8abb3",
    alignItems: "center",
    justifyContent: "center",
  },
});
