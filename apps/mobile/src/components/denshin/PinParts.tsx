import { EventCloudPin } from "../EventCloudPin";
import {
  DenshinLogo,
  SuperAsset,
  type SuperAssetName,
} from "../icons/SuperAsset";
import { SpeechBubble } from "./SpeechBubble";
import { NativeIconButton } from "./NativeIconButton";
import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "../Avatar";
import type { PinPerson } from "../../lib/denshin";
export const green = "#34C759";
export function RecruitmentGlyph({ color = green }: { color?: string }) {
  return <SuperAsset name="非常口rounded" size={21} tint={color} />;
}
export function RecruitBadge() {
  return (
    <SpeechBubble>
      <RecruitmentGlyph />
      <Text style={s.badgeText}>募集中</Text>
    </SpeechBubble>
  );
}
export function PinHeading({ suffix = "PIN" }: { suffix?: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexShrink: 1,
      }}
    >
      <DenshinLogo dark width={72} />
      <Text style={s.suffix}>{suffix}</Text>
    </View>
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
  const icons: Record<string, SuperAssetName> = {
    "×": "x",
    "✓": "check",
    "−": "minus",
    "＋": "add",
    "✎": "edit",
  };
  return (
    <NativeIconButton
      icon={icons[glyph] ?? "check"}
      label={label}
      onPress={onPress}
      disabled={disabled}
      active={active}
    />
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
  suffix: {
    fontFamily: "ui-rounded",
    color: "rgba(255,255,255,0.65)",
    fontWeight: "400",
    fontSize: 17,
  },
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
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
